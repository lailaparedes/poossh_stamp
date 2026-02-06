# Stripe Integration Setup Guide

## ✅ Completed Steps

1. Stripe account created
2. Products created in Stripe:
   - Starter: $45/month
   - Pro: $100/month
3. API keys configured in `.env`
4. Price IDs added to environment variables

## 📊 Database Migration Required

You need to add subscription tracking columns to your `merchant_portal_users` table in Supabase.

### Run this SQL in Supabase SQL Editor:

```sql
-- Add subscription columns to merchant_portal_users table
ALTER TABLE merchant_portal_users
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_status ON merchant_portal_users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_stripe_customer_id ON merchant_portal_users(stripe_customer_id);
```

### Subscription Status Values:
- `inactive` - No active subscription (default)
- `active` - Subscription is active and paid
- `past_due` - Payment failed, subscription at risk
- `canceled` - Subscription was canceled
- `trialing` - In trial period (if you add trials later)

## 🔗 Webhook Setup (Important for Production)

Stripe webhooks notify your backend when subscription events occur (payments, cancellations, etc.).

### Local Testing (Optional - using Stripe CLI):

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

### Production Setup (Required before deploying):

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set URL: `https://poossh.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Add to production `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

## 🎯 User Flow

1. User signs up → `/signup`
2. Account created → Auto-login
3. Redirected to → `/select-plan`
4. User selects plan → Redirected to Stripe Checkout
5. Payment completed → Redirected to `/subscription-success`
6. Verification complete → Redirected to `/setup` (create first card)
7. Setup complete → `/my-cards` (main dashboard)

## 🔐 Access Control (Future Enhancement)

You can now add plan-based restrictions:

### Starter Plan Limits:
- 1 stamp card only
- Basic analytics

### Pro Plan Features:
- Unlimited stamp cards
- Advanced analytics
- Priority support

### Example: Restrict card creation in MyCards.js

```javascript
const canCreateCard = user?.subscription_plan === 'pro' || 
                     !user?.merchant; // Starter gets 1 card

if (!canCreateCard) {
  alert('Upgrade to Pro to create multiple cards!');
  return;
}
```

## 💳 Test Cards

Use these in Stripe test mode:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

Any future date for expiry, any 3-digit CVC, any ZIP.

## 🚀 Going Live

1. Complete Stripe account verification
2. Switch from test keys to live keys in `.env`:
   - Replace `pk_test_` with `pk_live_`
   - Replace `sk_test_` with `sk_live_`
   - Get live price IDs from live products
3. Set up production webhook endpoint
4. Test with real payment (can refund)

## 📧 Next Steps

- Add subscription management page (cancel, upgrade, billing portal)
- Implement plan limits in features
- Add trial period (optional)
- Email receipts and notifications
