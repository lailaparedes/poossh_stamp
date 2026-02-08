-- Check what stamp_cards exist for Yonder1
SELECT 
  id,
  user_id,
  merchant_id,
  current_stamps,
  total_rewards,
  created_at
FROM stamp_cards
WHERE merchant_id = 'e760070b-10de-47af-b3b6-63fb5da6bdc6'
ORDER BY created_at DESC;

-- Count unique users vs total cards
SELECT 
  COUNT(*) as total_cards,
  COUNT(DISTINCT user_id) as unique_customers
FROM stamp_cards
WHERE merchant_id = 'e760070b-10de-47af-b3b6-63fb5da6bdc6';
