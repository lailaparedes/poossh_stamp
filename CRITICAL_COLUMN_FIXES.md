# Critical Column Name Fixes Required

## Column Mapping

### portal_merchant_users table
- ❌ `full_name` → ✅ `name`
- ❌ `merchant_id` → ✅ (REMOVED - no longer needed)
- ❌ `role` → ✅ (REMOVED - no longer needed)  
- ❌ `is_active` → ✅ (REMOVED - no longer needed)

### merchant_cards table
- ❌ `is_active` → ✅ (REMOVED - no longer needed)
- ❌ `common_merchant_id` → ✅ (REMOVED - no longer needed)
- ❌ `merchant_id` (in stamp_cards) → ✅ still valid (FK to merchant_cards)
- ✅ `created_by_user_id` (NEW - FK to portal_merchant_users)

## Files Requiring Manual Review

### HIGH PRIORITY
1. **backend/routes/auth.js**
   - Remove references to `full_name`, use `name`
   - Remove references to `role`
   - Remove references to `is_active`
   - Remove references to `merchant_id` in portal_merchant_users

2. **backend/routes/merchants.js**
   - Remove references to `is_active` in merchant_cards
   - Remove references to `common_merchant_id`
   - Update `created_by` to `created_by_user_id`
   - Remove portal_merchant_users.merchant_id column references

3. **backend/routes/analytics.js**
   - Verify `merchant_id` usage (should reference merchant_cards.id)

## Quick Fix Commands

### For auth.js column references:
```bash
# Update full_name to name
sed -i '' "s/full_name:/name:/g" backend/routes/auth.js

# Remove role references (manual review needed)
# Remove is_active references (manual review needed)
# Remove merchant_id from portal_merchant_users (manual review needed)
```

### For merchants.js:
```bash  
# Remove is_active (manual review needed)
# Remove common_merchant_id (manual review needed)
# Update created_by to created_by_user_id (manual review needed)
```

## Testing Checklist

After fixes:
- [ ] Can sign up new merchant
- [ ] Can login with demo@poosshstamp.com / Demo123!
- [ ] Can create new loyalty card
- [ ] Can view merchant cards
- [ ] Can view customers
- [ ] Analytics dashboard loads correctly

## SQL to Verify Schema

```sql
-- Check portal_merchant_users structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'portal_merchant_users'
ORDER BY ordinal_position;

-- Check merchant_cards structure  
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'merchant_cards'
ORDER BY ordinal_position;
```

## Note

Due to the extensive changes in the schema, a comprehensive code review and testing is required before deploying to production. Consider creating a staging environment to test these changes first.
