-- Check for demo user duplicates
SELECT 
  id,
  email,
  name,
  business_name,
  created_at,
  password_hash
FROM portal_merchant_users
WHERE email = 'demo@poosshstamp.com';

-- Count duplicates
SELECT 
  email,
  COUNT(*) as count
FROM portal_merchant_users
WHERE email = 'demo@poosshstamp.com'
GROUP BY email;
