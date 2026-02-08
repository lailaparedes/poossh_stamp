# 🚀 Quick Start Guide - Poossh Stamp Merchant Portal

## Your Server is Currently Running! ✅

**URL**: http://localhost:3000

---

## To Run Locally (Quick Commands)

```bash
# Navigate to project
cd /Users/lailaparedes/OfficialStamp/webpage

# Stop any running servers
killall node

# Start server
npm start
```

Then open: **http://localhost:3000**

---

## Fixing "Cannot Load Dashboard" Error

This error happens when you click on a card and the dashboard won't load.

### Quick Fix Steps:

1. **Check your database schema** - Run this SQL file in Supabase:
   - Open `CHECK_DATABASE_SCHEMA.sql`
   - Copy contents into Supabase SQL Editor
   - Click "Run"
   - Look for errors or missing columns

2. **Check Production Environment Variables**
   - Go to Render Dashboard → Your Service → Environment
   - Make sure these are set:
     ```
     SUPABASE_URL=https://ntxpoezharyyftyuywgu.supabase.co
     SUPABASE_ANON_KEY=eyJhbGc...
     ```

3. **Check Browser Console**
   - Open your site
   - Press F12
   - Go to Console tab
   - Look for red error messages
   - Take a screenshot if you see errors

4. **Check Render Logs**
   - Go to Render Dashboard → Your Service → Logs
   - Look for errors about "stamp_history" or "column does not exist"
   - Copy the error message

---

## Files to Help You

| File | What It Does |
|------|-------------|
| `START_LOCAL.md` | Detailed instructions to run locally |
| `DASHBOARD_ERROR_FIX.md` | Complete troubleshooting guide |
| `CHECK_DATABASE_SCHEMA.sql` | SQL script to check database |
| `DEPLOYMENT_CHECKLIST.md` | Deployment status and checklist |

---

## Common Issues & Fixes

### Issue 1: "Cannot find module 'express'"
```bash
cd /Users/lailaparedes/OfficialStamp/webpage
npm install
```

### Issue 2: "EADDRINUSE: address already in use"
```bash
killall node
```

### Issue 3: Frontend not showing / 404 error
```bash
npm run build:frontend
npm start
```

### Issue 4: "Session expired" or "Invalid token"
- Clear browser cookies
- Log out and log back in
- Check if SUPABASE_URL is set correctly

---

## Testing Checklist

- [ ] Open http://localhost:3000
- [ ] Can log in
- [ ] Can see dashboard/landing page
- [ ] Can click on a card
- [ ] Card dashboard loads without errors
- [ ] Can see analytics charts
- [ ] No errors in browser console (F12)

---

## What's Running Right Now

Your server is running on **port 3000**.

To check if it's working:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{"status":"ok","message":"Poossh Stamp Merchant API is running"}
```

---

## Next Steps

1. **Open http://localhost:3000** in your browser
2. **Try logging in**
3. **Click on a card** to see if the dashboard loads
4. **If you get an error**:
   - Check browser console (F12)
   - Look at error message
   - Run `CHECK_DATABASE_SCHEMA.sql` in Supabase
   - Read `DASHBOARD_ERROR_FIX.md` for solutions

---

## Need More Help?

Send me:
1. Screenshot of the error
2. Browser console errors (F12 → Console)
3. Results from running `CHECK_DATABASE_SCHEMA.sql`
4. Last 20 lines of Render logs (if on production)

---

## Stopping the Server

```bash
killall node
```

Or press `Ctrl+C` in the terminal where it's running.

---

**Your local server is ready!** 🎉  
Go to: **http://localhost:3000**
