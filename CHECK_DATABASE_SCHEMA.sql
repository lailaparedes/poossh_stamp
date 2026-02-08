-- ====================================
-- DATABASE SCHEMA DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor
-- ====================================

-- 1. CHECK ALL RELEVANT TABLES EXIST
-- ====================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'portal_merchant_users',
    'merchant_cards', 
    'stamp_cards',
    'stamp_history',
    'merchant_card_analytics',
    'merchants'
  )
ORDER BY table_name;

-- Expected tables:
-- ✅ portal_merchant_users
-- ✅ merchant_cards
-- ✅ stamp_cards
-- ✅ stamp_history
-- ✅ merchant_card_analytics


-- 2. CHECK STAMP_HISTORY COLUMNS (Most likely issue)
-- ====================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stamp_history'
ORDER BY ordinal_position;

-- Expected columns:
-- ✅ id (uuid or bigint)
-- ✅ card_id (uuid) ← IMPORTANT: Should be 'card_id' NOT 'stamp_card_id'
-- ✅ merchant_id (uuid)
-- ✅ user_id (uuid)
-- ✅ amount (integer)
-- ✅ created_at (timestamp)


-- 3. CHECK MERCHANT_CARD_ANALYTICS COLUMNS
-- ====================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'merchant_card_analytics'
ORDER BY ordinal_position;

-- Expected columns:
-- ✅ id
-- ✅ merchant_card_id
-- ✅ active_cards
-- ✅ total_customers
-- ✅ total_stamps
-- ✅ total_rewards
-- ✅ redeemed_rewards
-- ✅ pending_rewards
-- ✅ redemption_rate
-- ✅ updated_at


-- 4. CHECK STAMP_CARDS COLUMNS
-- ====================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stamp_cards'
ORDER BY ordinal_position;

-- Expected columns:
-- ✅ id
-- ✅ user_id
-- ✅ merchant_id
-- ✅ current_stamps
-- ✅ total_rewards
-- ✅ created_at
-- ✅ updated_at


-- 5. CHECK MERCHANT_CARDS COLUMNS
-- ====================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'merchant_cards'
ORDER BY ordinal_position;

-- Expected columns:
-- ✅ id
-- ✅ name (card name)
-- ✅ logo (emoji)
-- ✅ color
-- ✅ category
-- ✅ stamps_required
-- ✅ created_by_user_id
-- ✅ qr_code
-- ✅ qr_code_id


-- 6. CHECK DATA EXISTS
-- ====================================
SELECT 
  (SELECT COUNT(*) FROM portal_merchant_users) as users_count,
  (SELECT COUNT(*) FROM merchant_cards) as merchant_cards_count,
  (SELECT COUNT(*) FROM stamp_cards) as stamp_cards_count,
  (SELECT COUNT(*) FROM stamp_history) as stamp_history_count,
  (SELECT COUNT(*) FROM merchant_card_analytics) as analytics_count;


-- 7. CHECK YOUR USER ACCOUNT
-- ====================================
-- Replace 'demo@poosshstamp.com' with your email
SELECT 
  id,
  email,
  name,
  business_name,
  merchant_id,
  created_at
FROM portal_merchant_users
WHERE email = 'demo@poosshstamp.com'; -- ← CHANGE THIS TO YOUR EMAIL


-- 8. CHECK IF USER HAS MERCHANT CARDS
-- ====================================
-- Replace the user_id with your actual user ID from query above
SELECT 
  mc.id,
  mc.name,
  mc.logo,
  mc.stamps_required,
  mc.created_by_user_id,
  mc.qr_code_id,
  u.email as created_by_email
FROM merchant_cards mc
LEFT JOIN portal_merchant_users u ON mc.created_by_user_id = u.id
WHERE mc.created_by_user_id = 'YOUR_USER_ID_HERE'; -- ← REPLACE THIS


-- 9. CHECK SAMPLE DATA FROM STAMP_HISTORY
-- ====================================
SELECT 
  id,
  card_id,  -- ← This should exist, not 'stamp_card_id'
  merchant_id,
  user_id,
  amount,
  created_at
FROM stamp_history
ORDER BY created_at DESC
LIMIT 5;


-- 10. CHECK FOR ORPHANED DATA (Data integrity check)
-- ====================================
-- Find stamp_history records with no matching stamp_card
SELECT COUNT(*) as orphaned_stamp_history_records
FROM stamp_history sh
LEFT JOIN stamp_cards sc ON sh.card_id = sc.id
WHERE sc.id IS NULL;

-- Should be 0. If not, you have data integrity issues.


-- ====================================
-- COMMON FIXES
-- ====================================

-- FIX 1: If stamp_history is missing the card_id column
-- (Don't run this unless you confirmed it's missing from query #2)
/*
ALTER TABLE stamp_history 
ADD COLUMN IF NOT EXISTS card_id UUID 
REFERENCES stamp_cards(id);
*/

-- FIX 2: If you have no merchant_card_analytics data
-- Run the backfill script: populate-missing-analytics.sql

-- FIX 3: If portal_merchant_users has no merchant_id
-- You need to create a merchant card first in the Setup page

-- ====================================
-- WHAT TO SEND ME IF STILL BROKEN
-- ====================================
-- 1. Results from query #2 (stamp_history columns)
-- 2. Results from query #6 (data counts)
-- 3. Results from query #7 (your user info)
-- 4. Any error messages from Render logs
