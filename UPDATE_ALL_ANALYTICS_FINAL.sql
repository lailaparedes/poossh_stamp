-- Complete analytics update - fixes ALL fields correctly
UPDATE merchant_card_analytics mca
SET 
  -- Active cards = unique users with incomplete cards
  active_cards_count = COALESCE((
    SELECT COUNT(DISTINCT sc.user_id)
    FROM stamp_cards sc
    JOIN merchant_cards mc ON mc.id = sc.merchant_id
    WHERE sc.merchant_id = mca.merchant_card_id
      AND sc.current_stamps < mc.stamps_required
  ), 0),
  
  -- Total stamps = SUM of all stamps from stamp_history
  total_stamps_collected = COALESCE((
    SELECT SUM(amount)
    FROM stamp_history
    WHERE merchant_id = mca.merchant_card_id
  ), 0),
  
  -- Total rewards earned = SUM of total_rewards from stamp_cards
  total_rewards_earned = COALESCE((
    SELECT SUM(total_rewards)
    FROM stamp_cards
    WHERE merchant_id = mca.merchant_card_id
  ), 0),
  
  -- Unredeemed rewards = earned - redeemed
  unredeemed_rewards_count = COALESCE((
    SELECT SUM(total_rewards)
    FROM stamp_cards
    WHERE merchant_id = mca.merchant_card_id
  ), 0) - COALESCE(mca.total_rewards_redeemed, 0),
  
  -- Merchant name
  merchant_name = (
    SELECT name
    FROM merchant_cards
    WHERE id = mca.merchant_card_id
  ),
  
  last_calculated_at = NOW(),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM merchant_cards WHERE id = mca.merchant_card_id
);

-- Verify all fields are correct
SELECT 
  mc.name,
  mc.stamps_required,
  mca.active_cards_count,
  mca.total_stamps_collected,
  mca.total_rewards_earned,
  mca.total_rewards_redeemed,
  mca.unredeemed_rewards_count,
  (SELECT COUNT(DISTINCT user_id) FROM stamp_cards WHERE merchant_id = mc.id AND current_stamps < mc.stamps_required) as verify_active_count,
  (SELECT SUM(amount) FROM stamp_history WHERE merchant_id = mc.id) as verify_stamps_total
FROM merchant_card_analytics mca
JOIN merchant_cards mc ON mc.id = mca.merchant_card_id
ORDER BY mc.name;
