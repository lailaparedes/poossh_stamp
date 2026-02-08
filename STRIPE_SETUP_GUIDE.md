# 🔧 Complete Stripe Setup Guide

## Current Status

✅ **Stripe keys are already in your local `.env` file**  
❌ **Need to add them to Render production environment**

---

## Your Stripe Keys (Already Configured Locally)

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_PRICE_ID
STRIPE_PRO_PRICE_ID=price_YOUR_PRO_PRICE_ID
```

**Note**: These are TEST keys (start with `sk_test_` and `pk_test_`) - perfect for development!

---

## Step 1: Add Stripe Keys to Render Production

### Go to Render Dashboard:

1. Open: https://dashboard.render.com
2. Click on your service: **poossh-stamp-merchant-portal**
3. Go to **Environment** tab (left sidebar)
4. Add the following environment variables:

| Variable | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_YOUR_SECRET_KEY_HERE` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_YOUR_PUBLISHABLE_KEY_HERE` |
| `STRIPE_STARTER_PRICE_ID` | `price_YOUR_STARTER_PRICE_ID` |
| `STRIPE_PRO_PRICE_ID` | `price_1SxzdZ1lSqkYlFzRZp8n5OyQ` |

5. Click **"Save Changes"**
6. Render will automatically redeploy with Stripe enabled

---

## Step 2: Verify Your Stripe Account

### Check if your Stripe account is active:

1. Go to: https://dashboard.stripe.com
2. Log in with your Stripe account
3. You should see your dashboard

### If you don't have a Stripe account yet:

1. Go to: https://stripe.com
2. Click "Sign up"
3. Create your account
4. Complete verification
5. Get your API keys (we'll use the existing test keys for now)

---

## Step 3: Verify Price IDs

Your price IDs look suspicious - both Starter and Pro have the SAME price ID:
```
STRIPE_STARTER_PRICE_ID=price_1SxzdZ1lSqkYlFzRZp8n5OyQ
STRIPE_PRO_PRICE_ID=price_1SxzdZ1lSqkYlFzRZp8n5OyQ  ← Same ID!
```

### To Fix This:

1. **Go to Stripe Dashboard** → Products → Click on your product
2. **Create Two Price Points**:
   - **Starter Plan**: $45/month recurring
   - **Pro Plan**: $100/month recurring
3. **Copy the Price IDs**:
   - Each will look like `price_1XxXxXxXxXxXxXxXxXxXxXxXx`
4. **Update your `.env` file** with the correct IDs
5. **Update Render environment variables** with the new IDs

---

## Step 4: Test Locally First

Your local server already has Stripe configured! Test it:

```bash
# Make sure server is running
cd /Users/lailaparedes/OfficialStamp/webpage
npm start
```

Then:
1. Go to: http://localhost:3000/signup
2. Create a test account
3. You'll be redirected to plan selection
4. ✅ Should work without "Stripe not configured" error!

### To Test Payment (without actually charging):

Use Stripe's test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Exp Date**: Any future date (e.g., 12/30)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any ZIP code (e.g., 12345)

---

## Step 5: Set Up Stripe Webhook (For Production)

Webhooks notify your app when payments succeed/fail.

### Create Webhook in Stripe:

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Set Endpoint URL:
   ```
   https://your-render-app.onrender.com/api/stripe/webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **"Add endpoint"**
6. Copy the **Webhook Secret** (starts with `whsec_...`)
7. Add to Render environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

---

## Complete Environment Variables Checklist

### For Render Production:

```env
# Supabase (Already Set ✅)
SUPABASE_URL=https://ntxpoezharyyftyuywgu.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# Server Config (Already Set ✅)
NODE_ENV=production
PORT=3000
JWT_SECRET=(auto-generated)

# Stripe (NEED TO ADD ⚠️)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_PRICE_ID
STRIPE_PRO_PRICE_ID=price_1SxzdZ1lSqkYlFzRZp8n5OyQ
STRIPE_WEBHOOK_SECRET=whsec_... (create webhook first)

# Optional
APP_URL=https://your-app.onrender.com
```

---

## Testing Checklist

### Local Testing (Already Works):
- [ ] Server starts without errors
- [ ] Can sign up for account
- [ ] Redirected to plan selection page
- [ ] No "Stripe not configured" error
- [ ] Can click on a plan
- [ ] Redirected to Stripe Checkout
- [ ] Can complete test payment with `4242 4242 4242 4242`

### Production Testing (After Adding to Render):
- [ ] Render deployment completes
- [ ] Can sign up on production
- [ ] Plan selection works
- [ ] Stripe checkout works
- [ ] Payment processing works
- [ ] User gets access after payment

---

## Quick Copy-Paste for Render

### Environment Variables to Add:

```
STRIPE_SECRET_KEY
sk_test_YOUR_SECRET_KEY_HERE

STRIPE_PUBLISHABLE_KEY
pk_test_YOUR_PUBLISHABLE_KEY_HERE

STRIPE_STARTER_PRICE_ID
price_YOUR_STARTER_PRICE_ID

STRIPE_PRO_PRICE_ID
price_1SxzdZ1lSqkYlFzRZp8n5OyQ
```

---

## For Production (Live Payments):

When ready to go live:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Get Live API Keys**:
   - `sk_live_...` (instead of `sk_test_...`)
   - `pk_live_...` (instead of `pk_test_...`)
3. **Create Live Price IDs** for your products
4. **Update Render environment variables** with live keys
5. **Update webhook** to use live mode
6. **Test with real card** (will actually charge!)

---

## Need Help?

**Stripe Dashboard**: https://dashboard.stripe.com  
**Render Dashboard**: https://dashboard.render.com  
**Stripe Docs**: https://stripe.com/docs

---

## Summary

✅ **Local**: Stripe is already configured and working  
⚠️ **Production**: Need to add Stripe keys to Render environment  
📝 **Action**: Copy the 4 environment variables above to Render  
⏱️ **Time**: 5 minutes to configure  
🚀 **Result**: Plan selection will work on production!
