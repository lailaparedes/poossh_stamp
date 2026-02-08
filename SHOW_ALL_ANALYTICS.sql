-- Show EVERYTHING in merchant_card_analytics table
SELECT 
  id,
  merchant_card_id,
  merchant_name,
  active_cards_count,
  total_stamps_collected,
  total_rewards_earned,
  total_rewards_redeemed,
  unredeemed_rewards_count,
  updated_at
FROM merchant_card_analytics;
