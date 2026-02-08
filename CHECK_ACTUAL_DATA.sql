-- Check what data is ACTUALLY in merchant_card_analytics right now
SELECT 
  mca.merchant_card_id,
  mc.name as card_name,
  mca.active_cards_count,
  mca.total_stamps_collected,
  mca.total_rewards_earned,
  mca.total_rewards_redeemed,
  mca.unredeemed_rewards_count,
  mca.updated_at
FROM merchant_card_analytics mca
JOIN merchant_cards mc ON mc.id = mca.merchant_card_id
ORDER BY mc.name;

-- Also check what's in stamp_history
SELECT 
  mc.name as card_name,
  COUNT(*) as transaction_count,
  SUM(sh.amount) as total_stamps
FROM stamp_history sh
JOIN merchant_cards mc ON mc.id = sh.merchant_id
GROUP BY mc.name;

-- Check stamp_cards
SELECT 
  mc.name as card_name,
  COUNT(*) as total_cards,
  SUM(sc.total_rewards) as total_rewards
FROM stamp_cards sc
JOIN merchant_cards mc ON mc.id = sc.merchant_id
GROUP BY mc.name;
