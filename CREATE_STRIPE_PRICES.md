# 🛠️ Create Stripe Products & Price IDs

## The Problem

You're seeing: **"No such price: 'price_1SxzdZ1lSqkYlFzRZp8n5OyQ'"**

This means the price IDs in your `.env` file don't exist in your Stripe account yet.

---

## Solution: Create Products in Stripe Dashboard

### Step 1: Log into Stripe

1. Go to: **https://dashboard.stripe.com**
2. Log in to your account
3. Make sure you're in **Test Mode** (toggle in top right)

---

### Step 2: Create Starter Plan ($45/month)

1. Click **"Products"** in left sidebar (or go to https://dashboard.stripe.com/products)
2. Click **"+ Add product"** button
3. Fill in the details:

**Product Information:**
- **Name**: `Poossh Stamp - Starter Plan`
- **Description**: `Single loyalty card with unlimited stamps and basic analytics`

**Pricing:**
- **Pricing model**: Standard pricing
- **Price**: `$45.00`
- **Billing period**: Monthly (Recurring)
- **Currency**: USD

4. Click **"Save product"**
5. ✅ **IMPORTANT**: Copy the **Price ID** that appears
   - It will look like: `price_1ABC...XYZ` (starts with `price_`)
   - Save this somewhere - we'll use it in a moment!

---

### Step 3: Create Pro Plan ($100/month)

1. Still in **Products**, click **"+ Add product"** again
2. Fill in the details:

**Product Information:**
- **Name**: `Poossh Stamp - Pro Plan`
- **Description**: `Multiple loyalty cards with unlimited stamps and advanced analytics`

**Pricing:**
- **Pricing model**: Standard pricing
- **Price**: `$100.00`
- **Billing period**: Monthly (Recurring)
- **Currency**: USD

3. Click **"Save product"**
4. ✅ **IMPORTANT**: Copy this **Price ID** too!

---

### Step 4: Update Your .env File

Now update your `.env` file with the REAL price IDs you just copied:

```env
# Keep existing values
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# UPDATE THESE with your NEW price IDs from Stripe:
STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_PRICE_ID_HERE
STRIPE_PRO_PRICE_ID=price_YOUR_PRO_PRICE_ID_HERE
```

---

### Step 5: Restart Your Server

```bash
cd /Users/lailaparedes/OfficialStamp/webpage
killall node
npm start
```

---

### Step 6: Test Again

1. Go to: http://localhost:3000/signup
2. Create a test account
3. You'll see plan selection
4. Click a plan
5. ✅ Should redirect to Stripe checkout (no error!)

---

## Quick Visual Guide

### Where to Find Price IDs:

After creating a product, you'll see:

```
Product: Poossh Stamp - Starter Plan
Price: $45.00 / month
Price ID: price_1O8abc123xyz456def789  ← COPY THIS!
```

The Price ID is what you need!

---

## For Production (Render):

After you get it working locally:

1. Go to **Render Dashboard** → Your Service → **Environment**
2. Update/Add these variables with your REAL price IDs:
   ```
   STRIPE_STARTER_PRICE_ID=price_YOUR_STARTER_ID
   STRIPE_PRO_PRICE_ID=price_YOUR_PRO_ID
   ```
3. Save changes
4. Render will redeploy

---

## Alternative: Use Stripe CLI (Advanced)

If you prefer command line:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Create Starter Plan
stripe products create \
  --name="Poossh Stamp - Starter Plan" \
  --description="Single loyalty card with unlimited stamps"

# Create Price for Starter
stripe prices create \
  --product=prod_YOUR_PRODUCT_ID \
  --unit-amount=4500 \
  --currency=usd \
  --recurring[interval]=month

# Repeat for Pro Plan at $100 (10000 cents)
```

---

## Troubleshooting

### Can't find Products page?
- Direct link: https://dashboard.stripe.com/products
- Or: Dashboard → Products (left sidebar)

### Price ID doesn't start with "price_"?
- Make sure you copied the **Price ID**, not the Product ID
- Product IDs start with `prod_`
- Price IDs start with `price_`

### Still getting error?
- Make sure you're in **Test Mode** (toggle in top right of Stripe)
- Make sure `.env` file is saved
- Restart your server after updating `.env`
- Check for typos in the price IDs

---

## What You Should See After Creating Products

In your Stripe Dashboard → Products:

```
✅ Poossh Stamp - Starter Plan     $45.00/month    price_1ABC...
✅ Poossh Stamp - Pro Plan         $100.00/month   price_1XYZ...
```

Copy those `price_` IDs to your `.env` file!

---

## Summary

1. ✅ Go to https://dashboard.stripe.com/products
2. ✅ Create "Starter Plan" product at $45/month
3. ✅ Create "Pro Plan" product at $100/month  
4. ✅ Copy both Price IDs (start with `price_`)
5. ✅ Update `.env` file with real price IDs
6. ✅ Restart server: `killall node && npm start`
7. ✅ Test signup at http://localhost:3000/signup

**Time**: 5-10 minutes  
**Result**: Stripe checkout will work perfectly! 🎉
