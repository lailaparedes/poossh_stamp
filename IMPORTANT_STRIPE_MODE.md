# ⚠️ IMPORTANT: Stripe Test vs Live Mode

## Current Configuration Status

✅ **Your .env is now configured with:**
```
STRIPE_STARTER_PRICE_ID=price_1SxzcY1lSqkYlFzRNy0UUjEz
STRIPE_PRO_PRICE_ID=price_1SxzdZ1lSqkYlFzRZp8n5OyQ
STRIPE_SECRET_KEY=sk_test_... (TEST MODE)
STRIPE_PUBLISHABLE_KEY=pk_test_... (TEST MODE)
```

## ⚠️ Key Mismatch Detected!

You provided a **LIVE** publishable key:
```
pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE
```

But your .env file currently has **TEST** keys (`sk_test_` and `pk_test_`)

---

## Understanding Test vs Live Mode

### Test Mode (Current Setup)
- ✅ **Use for development/testing**
- ✅ No real money charged
- ✅ Use test credit cards (4242 4242 4242 4242)
- ✅ Safe to experiment
- Keys start with: `sk_test_` and `pk_test_`

### Live Mode (For Production)
- ⚠️ **Real money gets charged**
- ⚠️ Real customer credit cards
- ⚠️ Need verified Stripe account
- Keys start with: `sk_live_` and `pk_live_`

---

## What You Should Do

### Option 1: Keep Test Mode (Recommended for Now)
**Current setup is CORRECT for development!**

Keep your `.env` as is:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_ID
STRIPE_PRO_PRICE_ID=price_YOUR_PRO_ID
```

✅ **Test your app now!**
1. Go to http://localhost:3000/signup
2. Create account
3. Select a plan
4. Use test card: `4242 4242 4242 4242`
5. No real money charged!

---

### Option 2: Switch to Live Mode (For Production)

⚠️ **ONLY do this when ready to accept real payments!**

You'll need:
1. **Verified Stripe account**
2. **Live Secret Key** (starts with `sk_live_`)
3. **Live Publishable Key** (starts with `pk_live_`) - you have this one
4. **Live Price IDs** (created in Live mode)

To switch to Live mode:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Toggle to Live Mode** (top right switch)
3. **Get your Live Secret Key**:
   - Go to Developers → API Keys
   - Copy the "Secret key" (starts with `sk_live_`)
4. **Verify Price IDs exist in Live Mode**:
   - Go to Products
   - Make sure your prices exist in Live mode
   - Get the Live price IDs
5. **Update .env**:
   ```env
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
   STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
   STRIPE_STARTER_PRICE_ID=price_YOUR_LIVE_STARTER_ID
   STRIPE_PRO_PRICE_ID=price_YOUR_LIVE_PRO_ID
   ```

---

## Common Mistake: Mixing Test & Live Keys

❌ **This WILL NOT work:**
```env
STRIPE_SECRET_KEY=sk_test_...  ← TEST
STRIPE_PUBLISHABLE_KEY=pk_live_...  ← LIVE
```

✅ **Both must match:**
```env
# Either ALL test:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Or ALL live:
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Your Current Price IDs

These price IDs are likely in **Test Mode**:
- Starter: `price_1SxzcY1lSqkYlFzRNy0UUjEz`
- Pro: `price_1SxzdZ1lSqkYlFzRZp8n5OyQ`

✅ This is correct for testing!

If you switch to Live mode, you'll need to:
1. Toggle Stripe to Live mode
2. Create the same products in Live mode
3. Get the new Live price IDs
4. Update your .env

---

## For Render Production

### If Testing:
Use TEST keys everywhere:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_STARTER_PRICE_ID=price_1SxzcY... (test)
STRIPE_PRO_PRICE_ID=price_1SxzdZ... (test)
```

### If Going Live:
Use LIVE keys everywhere:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_STARTER_PRICE_ID=price_... (live)
STRIPE_PRO_PRICE_ID=price_... (live)
```

---

## Test Card Numbers

When using TEST mode:

**Success:**
- `4242 4242 4242 4242`

**Declined:**
- `4000 0000 0000 0002`

**Requires Authentication:**
- `4000 0025 0000 3155`

**Exp Date**: Any future date (e.g., 12/30)
**CVC**: Any 3 digits (e.g., 123)

---

## Summary

✅ **Current Status**: You're in **TEST MODE** (correct for development)

✅ **Your .env is configured correctly for testing**

✅ **Next Step**: Test signup at http://localhost:3000/signup

⏭️ **Later**: When ready for real payments, switch all keys to Live mode

---

## Quick Test Now!

```bash
# Server should be running already
# Go to: http://localhost:3000/signup

1. Create account
2. Select a plan
3. Use card: 4242 4242 4242 4242
4. Should work!
```

🎉 No real money will be charged in TEST mode!
