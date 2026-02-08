-- Check if analytics exists for NewTest card
SELECT * 
FROM merchant_card_analytics 
WHERE merchant_card_id = 'fb7c57b8-5264-4aee-b881-a3f4d15fea08';

-- If no result, check all analytics data
SELECT 
  mca.merchant_card_id,
  mc.name,
  mca.total_stamps_collected,
  mca.active_cards_count,
  mca.unredeemed_rewards_count
FROM merchant_card_analytics mca
LEFT JOIN merchant_cards mc ON mc.id = mca.merchant_card_id;

-- Check if there's ANY data in merchant_card_analytics
SELECT COUNT(*) as total_analytics_records FROM merchant_card_analytics;
