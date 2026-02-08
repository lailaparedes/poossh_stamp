-- Update merchant_card_analytics with correct column names
-- Run this in Supabase SQL Editor

-- Step 1: See current vs expected data
SELECT 
  mc.id as card_id,
  mc.name as card_name,
  mca.total_stamps_collected as current_total,
  COALESCE(SUM(sh.amount), 0) as should_be_total,
  mca.active_cards_count as current_cards,
  COUNT(DISTINCT sc.id) as should_be_cards
FROM merchant_cards mc
LEFT JOIN merchant_card_analytics mca ON mca.merchant_card_id = mc.id
LEFT JOIN stamp_history sh ON sh.merchant_id = mc.id
LEFT JOIN stamp_cards sc ON sc.merchant_id = mc.id
GROUP BY mc.id, mc.name, mca.total_stamps_collected, mca.active_cards_count
ORDER BY mc.name;

-- Step 2: Update total_stamps_collected from stamp_history
UPDATE merchant_card_analytics mca
SET 
  total_stamps_collected = COALESCE((
    SELECT SUM(amount)
    FROM stamp_history
    WHERE merchant_id = mca.merchant_card_id
  ), 0),
  last_calculated_at = NOW(),
  updated_at = NOW();

-- Step 3: Update active_cards_count
UPDATE merchant_card_analytics mca
SET 
  active_cards_count = COALESCE((
    SELECT COUNT(*)
    FROM stamp_cards
    WHERE merchant_id = mca.merchant_card_id
  ), 0),
  updated_at = NOW();

-- Step 4: Update total_rewards_earned (total rewards given)
UPDATE merchant_card_analytics mca
SET 
  total_rewards_earned = COALESCE((
    SELECT SUM(total_rewards)
    FROM stamp_cards
    WHERE merchant_id = mca.merchant_card_id
  ), 0),
  updated_at = NOW();

-- Step 5: Calculate unredeemed rewards
-- (This assumes redeemed rewards tracking - adjust if needed)
UPDATE merchant_card_analytics mca
SET 
  unredeemed_rewards_count = 
    COALESCE(total_rewards_earned, 0) - COALESCE(total_rewards_redeemed, 0),
  updated_at = NOW();

-- Step 6: Update merchant_name
UPDATE merchant_card_analytics mca
SET 
  merchant_name = (
    SELECT name
    FROM merchant_cards
    WHERE id = mca.merchant_card_id
  ),
  updated_at = NOW();

-- Step 7: Verify the updates
SELECT 
  mc.name,
  mca.total_stamps_collected,
  mca.active_cards_count,
  mca.total_rewards_earned,
  mca.total_rewards_redeemed,
  mca.unredeemed_rewards_count,
  mca.updated_at
FROM merchant_card_analytics mca
JOIN merchant_cards mc ON mc.id = mca.merchant_card_id
ORDER BY mc.name;

-- Step 8: If no analytics exist for a card, create them
INSERT INTO merchant_card_analytics (
  merchant_card_id,
  merchant_name,
  active_cards_count,
  total_stamps_collected,
  total_rewards_earned,
  total_rewards_redeemed,
  unredeemed_rewards_count,
  last_calculated_at,
  created_at,
  updated_at
)
SELECT 
  mc.id,
  mc.name,
  COUNT(DISTINCT sc.id) as active_cards_count,
  COALESCE(SUM(sh.amount), 0) as total_stamps_collected,
  COALESCE(SUM(sc.total_rewards), 0) as total_rewards_earned,
  0 as total_rewards_redeemed,
  COALESCE(SUM(sc.total_rewards), 0) as unredeemed_rewards_count,
  NOW(),
  NOW(),
  NOW()
FROM merchant_cards mc
LEFT JOIN stamp_history sh ON sh.merchant_id = mc.id
LEFT JOIN stamp_cards sc ON sc.merchant_id = mc.id
WHERE NOT EXISTS (
  SELECT 1 FROM merchant_card_analytics WHERE merchant_card_id = mc.id
)
GROUP BY mc.id, mc.name;

-- Final verification
SELECT 
  'Analytics fixed!' as status,
  COUNT(*) as total_cards_with_analytics
FROM merchant_card_analytics;
