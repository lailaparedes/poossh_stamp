-- Fix Demo Account - Final Version
-- Run this in your Supabase SQL Editor

-- Step 1: Check current state
SELECT 
  id,
  email,
  name,
  business_name,
  created_at,
  SUBSTRING(password_hash, 1, 20) as password_hash_preview
FROM portal_merchant_users
WHERE email = 'demo@poosshstamp.com'
ORDER BY created_at;

-- Step 2: Delete duplicates, keep only the oldest one
DELETE FROM portal_merchant_users 
WHERE email = 'demo@poosshstamp.com' 
AND id NOT IN (
  SELECT id 
  FROM portal_merchant_users 
  WHERE email = 'demo@poosshstamp.com'
  ORDER BY created_at ASC
  LIMIT 1
);

-- Step 3: Update the remaining demo account with correct password
-- Password: Demo123!
UPDATE portal_merchant_users 
SET password_hash = '$2a$10$YWfvP3WX2VXn5hZQE8YHyO3.9xJZZGP9zKZs4MH8N/rKQ5N5xK6LS'
WHERE email = 'demo@poosshstamp.com';

-- Step 4: Verify final state
SELECT 
  id,
  email,
  name,
  business_name,
  created_at,
  '✅ Demo account is ready!' as status,
  'Email: demo@poosshstamp.com' as login_email,
  'Password: Demo123!' as login_password
FROM portal_merchant_users
WHERE email = 'demo@poosshstamp.com';
