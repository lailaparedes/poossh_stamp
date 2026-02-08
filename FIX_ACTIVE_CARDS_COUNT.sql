-- Update active_cards_count to count unique users with incomplete cards
UPDATE merchant_card_analytics mca
SET 
  active_cards_count = COALESCE((
    SELECT COUNT(DISTINCT sc.user_id)
    FROM stamp_cards sc
    JOIN merchant_cards mc ON mc.id = sc.merchant_id
    WHERE sc.merchant_id = mca.merchant_card_id
      AND sc.current_stamps < mc.stamps_required  -- Not yet completed
  ), 0),
  updated_at = NOW();

-- Verify the fix - show what it should be vs what it is
SELECT 
  mc.name,
  mca.active_cards_count as current_count,
  (
    SELECT COUNT(DISTINCT sc.user_id)
    FROM stamp_cards sc
    WHERE sc.merchant_id = mc.id
      AND sc.current_stamps < mc.stamps_required
  ) as should_be_count
FROM merchant_card_analytics mca
JOIN merchant_cards mc ON mc.id = mca.merchant_card_id
ORDER BY mc.name;
