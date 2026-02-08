-- QUICK FIX: Update merchant_card_analytics with stamp_history totals
-- Run this in Supabase SQL Editor

-- Step 1: Check current analytics table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'merchant_card_analytics'
ORDER BY ordinal_position;

-- Step 2: See current data (check what columns exist first)
SELECT * FROM merchant_card_analytics LIMIT 5;

-- Step 3: See what data should be
SELECT 
  mc.id as card_id,
  mc.name as card_name,
  COALESCE(SUM(sh.amount), 0) as total_stamps_from_history,
  COUNT(DISTINCT sc.id) as active_cards_count,
  COUNT(sh.id) as stamp_transactions
FROM merchant_cards mc
LEFT JOIN stamp_history sh ON sh.merchant_id = mc.id
LEFT JOIN stamp_cards sc ON sc.merchant_id = mc.id
GROUP BY mc.id, mc.name
ORDER BY mc.name;

-- Step 4: Check if merchant_card_analytics has any data
SELECT 
  mca.*,
  mc.name as card_name
FROM merchant_card_analytics mca
JOIN merchant_cards mc ON mc.id = mca.merchant_card_id;

-- ======================================
-- AFTER RUNNING STEPS 1-4 ABOVE, 
-- CHECK THE ACTUAL COLUMN NAMES,
-- THEN RUN THE APPROPRIATE UPDATE BELOW
-- ======================================

-- If you see these columns exist, run corresponding update:

-- For active_cards column:
-- UPDATE merchant_card_analytics mca
-- SET active_cards = (
--   SELECT COUNT(*) FROM stamp_cards WHERE merchant_id = mca.merchant_card_id
-- );

-- For total_customers column:
-- UPDATE merchant_card_analytics mca
-- SET total_customers = (
--   SELECT COUNT(DISTINCT user_id) FROM stamp_cards WHERE merchant_id = mca.merchant_card_id
-- );
