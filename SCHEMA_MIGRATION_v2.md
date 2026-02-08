# Database Schema Migration v2.0 - Summary

## Changes Made

### 1. Table Name Updates
- ✅ `merchant_portal_users` → `portal_merchant_users`
- ✅ `merchants` → `merchant_cards`

### 2. Files Updated
- ✅ `backend/routes/auth.js`
- ✅ `backend/routes/merchants.js`
- ✅ `backend/routes/analytics.js`
- ✅ `routes/subscription.js`
- ✅ `routes/stripe.js`

### 3. Schema Column Changes

#### portal_merchant_users (NEW)
```
- id (UUID, PK)
- email (TEXT, UNIQUE)
- name (TEXT) 
- business_name (TEXT)
- password_hash (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Removed columns:**
- merchant_id
- full_name (now just `name`)
- role
- is_active

#### merchant_cards (NEW)
```
- id (UUID, PK)
- name (TEXT)
- logo (TEXT)
- category (TEXT)
- stamps_required (INTEGER)
- reward_description (TEXT)
- color (TEXT)
- qr_code (TEXT)
- created_by_user_id (UUID, FK → portal_merchant_users.id)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Key changes:**
- `created_by` → `created_by_user_id`
- New: `reward_description`, `qr_code`

## Demo Account Setup

### Login Credentials
- **Email:** demo@poosshstamp.com
- **Password:** Demo123!

### SQL to Fix Demo Account
Run this in your Supabase SQL Editor:

```sql
-- Update demo account with proper password hash
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
  'Password is now: Demo123!' as note
FROM portal_merchant_users
WHERE email = 'demo@poosshstamp.com';
```

## Next Steps

1. **Run the SQL script** in Supabase SQL Editor to fix demo password
2. **Test locally** before deploying:
   ```bash
   cd backend && npm start
   ```
3. **Verify login** with demo@poosshstamp.com / Demo123!
4. **Deploy to production** once tested

## Important Notes

⚠️ **Database Compatibility:**
- Old code will NOT work with new schema
- All backend code has been updated to use new table names
- Frontend code uses API endpoints, so no changes needed there

⚠️ **Migration Required:**
- If you have existing production data, you'll need to migrate it
- Contact support or run migration scripts before deploying

## Backup Files Created
All updated files have `.backup` copies in case you need to revert:
- `backend/routes/auth.js.backup`
- `backend/routes/merchants.js.backup`
- `backend/routes/analytics.js.backup`
- `routes/subscription.js.backup`
- `routes/stripe.js.backup`
