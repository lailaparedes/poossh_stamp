# Deployment Checklist - Poossh Stamp Merchant Portal

## ✅ Issues Fixed

1. **Nested Git Repository** - Removed `backend/.git` causing Git tracking issues ✅
2. **Environment Loading** - Fixed `server.js` to properly load environment variables ✅
3. **Build Commands** - Updated `render.yaml` with correct paths ✅
4. **Documentation** - Updated deployment instructions ✅
5. **Path Error in test-db.js** - Fixed incorrect module path reference ✅
6. **Stripe Integration** - Made Stripe optional to prevent crashes if not configured ✅

## 🔧 Render Dashboard Configuration

### Go to your Render service and verify these settings:

### 1. Build & Deploy Settings
- **Build Command**: `npm install && cd frontend && npm install && npm run build && cd ..`
- **Start Command**: `node server.js`
- **Auto-Deploy**: ON (deploys automatically on git push)

### 2. Environment Variables (CRITICAL!)
Make sure these are set in Render Dashboard → Your Service → Environment:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Already set in render.yaml |
| `PORT` | `3000` | Already set in render.yaml |
| `SUPABASE_URL` | `https://ntxpoezharyyftyuywgu.supabase.co` | ⚠️ **SET THIS!** |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | ⚠️ **SET THIS!** (your full anon key) |
| `JWT_SECRET` | Auto-generated | ✅ Already configured in render.yaml |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | Optional - only if using Stripe |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | Optional - only if using Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Optional - only if using Stripe webhooks |
| `APP_URL` | `https://your-render-url.onrender.com` | Optional - your production URL |

### 3. Health Check
- **Health Check Path**: `/api/health`
- **Health Check Grace Period**: 60 seconds

## 🚀 Deployment Status

Your code has been pushed to GitHub. Render should automatically start deploying.

### Monitor the Deployment:

1. Go to: https://dashboard.render.com
2. Click on your service: `poossh-stamp-merchant-portal`
3. Go to the **"Logs"** tab
4. Watch for:
   - ✅ `Build successful`
   - ✅ `Compiled successfully`
   - ✅ `Server running on port 3000`
   - ❌ Any error messages

## 🔍 Troubleshooting

### If Build Fails:

**Check the build logs for:**
```
npm ERR! 
```

**Common fixes:**
- Ensure `Node.js >= 18.0.0` is specified in `package.json` ✅ (already set)
- Check that all dependencies are in `package.json` ✅ (already correct)
- Verify frontend builds successfully ✅ (tested locally)

### If Server Crashes on Start:

**Error: "Missing Supabase credentials"**
```
Solution: Add SUPABASE_URL and SUPABASE_ANON_KEY in Render dashboard
```

**Error: "Cannot find module"**
```
Solution: Rebuild with cleared cache:
1. Render Dashboard → Service → Manual Deploy → "Clear build cache & deploy"
```

**Error: "listen EADDRINUSE"**
```
Solution: This shouldn't happen on Render, but means port is in use
```

### If Health Check Fails:

**Test health endpoint locally:**
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok","message":"Poossh Stamp Merchant API is running"}
```

**On Render:**
- Wait 60 seconds after deploy (grace period)
- Check logs for server startup messages
- Verify `/api/health` endpoint returns 200 OK

## 📊 Database Requirements

### Before Your First Deployment, Run These SQL Scripts in Supabase:

The app expects these tables and columns to exist:

1. **merchant_portal_users** - User authentication
2. **merchants** - Merchant data with QR codes
3. **stamp_cards** - Customer loyalty cards
4. **stamp_history** - Stamp transactions (needs: `id`, `card_id`, `merchant_id`, `user_id`, `amount`, `created_at`)
5. **merchant_card_analytics** - Analytics data
6. **merchant_cards** - Card templates

### Check Database Schema:

Run in Supabase SQL Editor:
```sql
-- Check stamp_history schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stamp_history'
ORDER BY ordinal_position;
```

Expected columns:
- `id` (uuid or bigint)
- `card_id` (uuid) 
- `merchant_id` (uuid)
- `user_id` (uuid)
- `amount` (integer)
- `created_at` (timestamp)

⚠️ **Note:** The error you saw locally (`stamp_card_id does not exist`) suggests the schema might be outdated. Check if any column names have changed.

## ✨ Success Indicators

Your deployment is successful when you see:

1. ✅ **Build Logs**: "Compiled successfully" for frontend
2. ✅ **Deploy Logs**: "Server running on port 3000"
3. ✅ **Health Check**: Returns 200 OK
4. ✅ **URL**: Your site loads at `https://your-service.onrender.com`

## 🎯 Next Steps After Successful Deployment

1. **Test Login**: Try logging in with your merchant account
2. **Check Dashboard**: Verify analytics load correctly
3. **Test QR Generation**: Create a new QR code
4. **Monitor Logs**: Watch for any errors in production

## 📞 Still Having Issues?

If deployment still fails after following this checklist:

1. **Check Render Logs** - Full error messages will be there
2. **Verify All Environment Variables** - Double-check they're set correctly
3. **Test Database Connection** - Make sure Supabase credentials are correct
4. **Check Database Schema** - Ensure all required tables exist

---

**Latest Commits**: 
- `14991c6` - Make Stripe integration optional for deployment ✅
- `66fbb6b` - Fix incorrect path in test-db route ✅
- `e0c8d96` - Fix deployment configuration and environment loading ✅

**Deployment Status**: 🟢 Ready to Deploy (all critical issues fixed)  
**Last Updated**: Feb 7, 2026 11:15 PM
