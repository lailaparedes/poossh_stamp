# 🔧 Fix: "Cannot Load Dashboard" Error

## The Problem

When clicking on a card to view its dashboard, you see an error message like:
- "Failed to load dashboard data"
- "Cannot load dashboard"
- Error 500 or data not loading

## Root Causes & Solutions

### Issue 1: Database Schema Mismatch ⚠️

**Error in logs**: `column stamp_history.stamp_card_id does not exist`

Your production database is missing some columns or has different column names than expected.

#### Fix: Run this SQL in your Supabase SQL Editor

```sql
-- Check current stamp_history schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stamp_history'
ORDER BY ordinal_position;

-- If stamp_card_id doesn't exist but card_id does, add an alias or rename
-- Check what columns actually exist first, then we can create a migration
```

### Issue 2: Missing Environment Variables on Production

Make sure these are set in your **Render Dashboard → Environment**:

```
SUPABASE_URL=https://ntxpoezharyyftyuywgu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50eHBvZXpoYXJ5eWZ0eXV5d2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTY1MDMsImV4cCI6MjA4NDY5MjUwM30._xwkL4PRA7qe-kYFeYWF3_R9zJHibhficNQTE1KLNd4
```

### Issue 3: Authentication Token Issues

If you see "Session expired" or "Invalid token":

1. Clear browser cookies
2. Log out and log back in
3. Check browser console (F12) for specific error messages

---

## 🔍 Debugging Steps

### Step 1: Check Your Production Logs

Go to: **Render Dashboard → Your Service → Logs**

Look for errors like:
- `code: '42703'` - Column doesn't exist  
- `column stamp_history.stamp_card_id does not exist`
- `Failed to load dashboard`
- Any SQL errors

### Step 2: Test Locally

1. **Start your local server**:
```bash
cd /Users/lailaparedes/OfficialStamp/webpage
npm start
```

2. **Open browser**: http://localhost:3000

3. **Open DevTools**: Press `F12` or `Right-click → Inspect`

4. **Go to Console tab**

5. **Try to log in and view dashboard**

6. **Check for errors** in the Console

### Step 3: Test API Endpoints Directly

Open these URLs in your browser while logged in:

**Local:**
- http://localhost:3000/api/health
- http://localhost:3000/api/analytics/dashboard

**Production (replace with your Render URL):**
- https://your-app.onrender.com/api/health
- https://your-app.onrender.com/api/analytics/dashboard

### Step 4: Check Database Schema

Run this in **Supabase SQL Editor**:

```sql
-- 1. Check stamp_history table structure
SELECT 
  table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('stamp_history', 'stamp_cards', 'merchant_cards', 'merchant_card_analytics')
ORDER BY table_name, ordinal_position;

-- 2. Check if there's actual data
SELECT COUNT(*) as total_stamps FROM stamp_history;
SELECT COUNT(*) as total_cards FROM stamp_cards;
SELECT COUNT(*) as total_merchant_cards FROM merchant_cards;

-- 3. Check a sample of stamp_history data
SELECT * FROM stamp_history LIMIT 5;
```

---

## 🚑 Quick Fixes

### Fix 1: Rebuild Production
Sometimes a fresh deploy helps:

1. Go to Render Dashboard
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Wait for deployment to complete
4. Test again

### Fix 2: Check Merchant Association

Make sure your user account is properly linked to a merchant:

```sql
-- Check your user in Supabase
SELECT * FROM portal_merchant_users WHERE email = 'your@email.com';

-- Check if they have a merchant_id
-- If merchant_id is NULL, you need to create a merchant card first
```

### Fix 3: Clear Cache

In your app, try clicking the "Refresh" button or manually clear the cache:

```javascript
// The app has a cache clearing endpoint
fetch('/api/analytics/clear-cache', { method: 'POST' })
```

---

## 🎯 Most Likely Fix for "Cannot Load Dashboard"

Based on the error you saw before deployment, run this SQL fix:

```sql
-- Option A: If stamp_history has 'card_id' but code expects 'stamp_card_id'
-- We need to check the actual schema first

-- Check what the actual column name is:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'stamp_history' 
  AND column_name LIKE '%card%';

-- If it shows 'card_id', then the code is correct
-- If it shows 'stamp_card_id', then we need to update the queries
```

---

## 📊 Expected Data Flow

1. User logs in → Gets JWT token
2. User clicks card → Sends request to `/api/analytics/dashboard?merchantId=xxx`
3. Server queries:
   - `merchant_card_analytics` table for overview stats
   - `stamp_cards` for customer count
   - `stamp_history` for stamp activity
4. Returns JSON with dashboard data
5. Frontend displays charts and stats

---

## 🆘 Still Not Working?

Send me:
1. **Screenshot of the error** in browser
2. **Browser Console errors** (F12 → Console tab)
3. **Render logs** (last 50 lines)
4. **Result of this SQL query**:
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('stamp_history', 'merchant_card_analytics')
ORDER BY table_name, ordinal_position;
```

---

## ✅ Success Checklist

- [ ] Server is running (http://localhost:3000 or Render URL loads)
- [ ] Environment variables are set
- [ ] Can log in successfully  
- [ ] Health check returns OK: `/api/health`
- [ ] Dashboard loads without errors
- [ ] Can see analytics charts
- [ ] No errors in browser console
- [ ] No errors in Render logs
