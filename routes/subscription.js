const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authenticateMerchant = require('../middleware/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Check subscription status and deactivate cards if needed
router.post('/check-grace-period', authenticateMerchant, async (req, res) => {
  try {
    const userId = req.merchant.userId;

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('merchant_portal_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.json({ success: false, error: 'User not found' });
    }

    // Check if subscription is canceled and grace period has expired
    if (user.subscription_status === 'canceled' && user.subscription_end_date) {
      const gracePeriodEnd = new Date(user.subscription_end_date);
      const now = new Date();

      if (now > gracePeriodEnd) {
        // Grace period expired - deactivate all cards
        const { error: deactivateError } = await supabase
          .from('merchants')
          .update({ is_active: false })
          .eq('created_by', userId);

        if (deactivateError) {
          console.error('Error deactivating cards:', deactivateError);
        } else {
          console.log('Cards deactivated for user:', userId);
        }

        return res.json({
          success: true,
          status: 'expired',
          message: 'Grace period expired. Cards have been deactivated.',
          daysRemaining: 0
        });
      }

      // Calculate days remaining
      const daysRemaining = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24));

      return res.json({
        success: true,
        status: 'grace_period',
        message: `Your cards will be deactivated in ${daysRemaining} days. Subscribe to keep them active.`,
        daysRemaining: daysRemaining,
        gracePeriodEnd: gracePeriodEnd.toISOString()
      });
    }

    return res.json({
      success: true,
      status: 'active',
      message: 'Subscription is active'
    });
  } catch (error) {
    console.error('Grace period check error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Get card count for user (with plan limits)
router.get('/card-count', authenticateMerchant, async (req, res) => {
  try {
    const userId = req.merchant.userId;

    // Get user subscription plan
    const { data: user, error: userError } = await supabase
      .from('merchant_portal_users')
      .select('subscription_plan, subscription_status')
      .eq('id', userId)
      .single();

    if (userError) {
      return res.json({ success: false, error: 'User not found' });
    }

    // Get active card count
    const { data: cards, error: cardsError } = await supabase
      .from('merchants')
      .select('id')
      .eq('created_by', userId)
      .eq('is_active', true);

    if (cardsError) {
      return res.json({ success: false, error: 'Failed to fetch cards' });
    }

    const cardCount = cards?.length || 0;
    const plan = user.subscription_plan;
    
    // Determine limits
    let maxCards;
    let canCreateMore = true;

    if (plan === 'starter') {
      maxCards = 2;
      canCreateMore = cardCount < 2;
    } else if (plan === 'pro') {
      maxCards = null; // unlimited
      canCreateMore = true;
    } else {
      maxCards = 0;
      canCreateMore = false;
    }

    return res.json({
      success: true,
      cardCount: cardCount,
      maxCards: maxCards,
      canCreateMore: canCreateMore,
      plan: plan,
      needsUpgrade: plan === 'starter' && cardCount >= 2
    });
  } catch (error) {
    console.error('Card count error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Reactivate cards after new subscription
router.post('/reactivate-cards', authenticateMerchant, async (req, res) => {
  try {
    const userId = req.merchant.userId;

    console.log('Reactivating cards for user:', userId);

    // Reactivate all cards for this user
    const { error: reactivateError } = await supabase
      .from('merchants')
      .update({ is_active: true })
      .eq('created_by', userId);

    if (reactivateError) {
      console.error('Error reactivating cards:', reactivateError);
      return res.json({ success: false, error: 'Failed to reactivate cards' });
    }

    console.log('Cards reactivated successfully');

    return res.json({
      success: true,
      message: 'Your loyalty cards have been reactivated!'
    });
  } catch (error) {
    console.error('Reactivate cards error:', error);
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
