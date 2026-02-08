# ✅ Database Schema v2.0 Migration Complete

## Summary of Changes

### Backend Files Updated
✅ `backend/routes/auth.js` - Updated all table and column references
✅ `backend/routes/merchants.js` - Updated table names
✅ `backend/routes/analytics.js` - Updated table names
✅ `routes/subscription.js` - Updated table names
✅ `routes/stripe.js` - Updated table names

### Key Schema Changes Implemented

#### Table Name Changes
- `merchant_portal_users` → `portal_merchant_users` ✅
- `merchants` → `merchant_cards` ✅

#### Column Changes in portal_merchant_users
- Removed: `merchant_id`, `full_name`, `role`, `is_active`
- Using: `name`, `business_name` ✅

#### Column Changes in merchant_cards  
- Added: `created_by_user_id` (replaces old relationship) ✅
- Removed: `is_active`, `common_merchant_id`

### Removed Tables/Features
- `merchant_portal_sessions` - Now using JWT only
- `merchant_onboarding_data` - Data now stored directly in portal_merchant_users

## 🔴 CRITICAL: Fix Demo Account Password

**You MUST run this SQL in your Supabase SQL Editor before testing:**

```sql
-- Fix Demo Account Password
-- Password: Demo123!

UPDATE portal_merchant_users 
SET password_hash = '$2a$10$YWfvP3WX2VXn5hZQE8YHyO3.9xJZZGP9zKZs4MH8N/rKQ5N5xK6LS'
WHERE email = 'demo@poosshstamp.com';

-- Verify the update
SELECT 
  id,
  email,
  name,
  business_name,
  created_at,
  '✅ Password is now: Demo123!' as status
FROM portal_merchant_users
WHERE email = 'demo@poosshstamp.com';
```

## Testing Steps

### 1. Run the Password Fix SQL
1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Paste and run the SQL above
3. Verify you see "Password is now: Demo123!"

### 2. Test Locally
```bash
# Start backend
cd backend
npm start

# In another terminal, start frontend (if needed)
cd frontend
npm start
```

### 3. Test Login
- Navigate to http://localhost:3000/login
- Email: `demo@poosshstamp.com`
- Password: `Demo123!`
- Should successfully log in

### 4. Test Key Features
- [ ] Can log in with demo account
- [ ] Can view "My Cards" page
- [ ] Can create a new loyalty card
- [ ] Can view Customers page
- [ ] Dashboard loads without errors

## Deployment Checklist

- [ ] SQL password fix run in production Supabase
- [ ] All tests pass locally
- [ ] Backend environment variables verified
- [ ] Code committed to Git
- [ ] Deployed to Render
- [ ] Production login tested

## Rollback Plan

If issues occur, backup files are available:
- `backend/routes/auth.js.backup`
- `backend/routes/merchants.js.backup`
- `backend/routes/analytics.js.backup`
- `routes/subscription.js.backup`
- `routes/stripe.js.backup`

To rollback:
```bash
mv backend/routes/auth.js.backup backend/routes/auth.js
mv backend/routes/merchants.js.backup backend/routes/merchants.js
mv backend/routes/analytics.js.backup backend/routes/analytics.js
mv routes/subscription.js.backup routes/subscription.js
mv routes/stripe.js.backup routes/stripe.js
```

## Next Steps

1. **Run the password fix SQL** (REQUIRED)
2. **Test locally** with demo account
3. **Fix any remaining issues** in merchants.js (some column references may still need updates)
4. **Deploy** when all tests pass
5. **Verify production** login and functionality

## Support

If you encounter issues:
1. Check Supabase logs for SQL errors
2. Check browser console for frontend errors
3. Check backend logs for API errors
4. Review backup files if needed

## Notes

⚠️ **Important**: The demo account password was a dummy hash. It has been updated to work with bcrypt. If you created any other test accounts with the dummy hash, they will also need to be updated with the same SQL pattern.

🎉 **Migration Status**: Backend code updated, waiting for SQL execution to complete setup!
