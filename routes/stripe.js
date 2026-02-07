const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const authenticateMerchant = require('../middleware/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create Stripe Checkout Session
router.post('/create-checkout-session', authenticateMerchant, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.merchant.userId;

    console.log('✅ Auth successful - Creating checkout session for user:', userId, 'plan:', plan);

    // Validate plan
    if (!plan || (plan !== 'starter' && plan !== 'pro')) {
      return res.json({ success: false, error: 'Invalid plan selected' });
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('merchant_portal_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User fetch error:', userError);
      return res.json({ success: false, error: 'User not found' });
    }

    // Get the correct price ID
    const priceId = plan === 'starter' 
      ? process.env.STRIPE_STARTER_PRICE_ID 
      : process.env.STRIPE_PRO_PRICE_ID;

    console.log('Using price ID:', priceId);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        plan: plan,
      },
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/select-plan`,
    });

    console.log('Checkout session created:', session.id);

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Verify checkout session (called after successful payment)
router.get('/verify-session', authenticateMerchant, async (req, res) => {
  try {
    const { session_id } = req.query;
    const userId = req.merchant.userId;

    if (!session_id) {
      return res.json({ success: false, error: 'No session ID provided' });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    console.log('Session retrieved:', session.id, 'status:', session.payment_status);

    if (session.payment_status === 'paid') {
      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      const planType = session.metadata.plan;

      console.log('Updating user subscription:', userId, 'plan:', planType);

      // Update user in database
      const { error: updateError } = await supabase
        .from('merchant_portal_users')
        .update({
          subscription_status: 'active',
          subscription_plan: planType,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          subscription_start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Database update error:', updateError);
        return res.json({ success: false, error: 'Failed to update subscription status' });
      }

      console.log('Subscription activated successfully');

      res.json({ 
        success: true, 
        plan: planType,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end
        }
      });
    } else {
      res.json({ success: false, error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Session verification error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Create Stripe Customer Portal Session (for managing billing)
router.post('/create-portal-session', authenticateMerchant, async (req, res) => {
  try {
    const userId = req.merchant.userId;

    console.log('Creating customer portal session for user:', userId);

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('merchant_portal_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User fetch error:', userError);
      return res.json({ success: false, error: 'User not found' });
    }

    if (!user.stripe_customer_id) {
      return res.json({ success: false, error: 'No billing account found. Please subscribe to a plan first.' });
    }

    // Create a portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.APP_URL || 'http://localhost:3000'}/profile`,
    });

    console.log('Portal session created:', session.id);

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Stripe Webhook Handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Webhook event received:', event.type);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout completed:', session.id);
      
      // Update subscription status
      if (session.mode === 'subscription' && session.metadata.userId) {
        const userId = session.metadata.userId;
        const plan = session.metadata.plan;
        
        await supabase
          .from('merchant_portal_users')
          .update({
            subscription_status: 'active',
            subscription_plan: plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            subscription_start_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('Subscription updated:', subscription.id);
      
      // Update subscription status in database
      await supabase
        .from('merchant_portal_users')
        .update({
          subscription_status: subscription.status,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);
      break;

    case 'customer.subscription.deleted':
      const canceledSubscription = event.data.object;
      console.log('Subscription canceled:', canceledSubscription.id);
      
      // Mark subscription as canceled
      await supabase
        .from('merchant_portal_users')
        .update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', canceledSubscription.id);
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object;
      console.log('Payment failed for invoice:', invoice.id);
      
      // Mark subscription as past_due
      await supabase
        .from('merchant_portal_users')
        .update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', invoice.customer);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
