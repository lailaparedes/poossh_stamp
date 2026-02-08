-- Check Database Setup
-- Run this in your Supabase SQL Editor to diagnose the issue

-- 1. Check if portal_merchant_users table exists
SELECT 
  'Table portal_merchant_users exists' as status,
  COUNT(*) as total_users
FROM portal_merchant_users;

-- 2. List all users in the table
SELECT 
  id,
  email,
  name,
  business_name,
  created_at
FROM portal_merchant_users
ORDER BY created_at DESC;

-- 3. Check specifically for demo account
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM portal_merchant_users WHERE email = 'demo@poosshstamp.com')
    THEN '✅ Demo account EXISTS'
    ELSE '❌ Demo account DOES NOT EXIST'
  END as demo_status;

-- 4. Check merchant_cards table
SELECT 
  'Table merchant_cards exists' as status,
  COUNT(*) as total_cards
FROM merchant_cards;

-- 5. List merchant cards
SELECT 
  id,
  name,
  created_by_user_id,
  category,
  created_at
FROM merchant_cards
ORDER BY created_at DESC
LIMIT 10;
