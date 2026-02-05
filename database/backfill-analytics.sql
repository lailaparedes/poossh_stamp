-- Backfill Historical Analytics Data
-- Run this once after creating daily_analytics table to populate historical data

-- Backfill last 90 days of analytics for all merchants
DO $$
DECLARE
  merchant_record RECORD;
  date_record DATE;
  start_date DATE := CURRENT_DATE - INTERVAL '90 days';
BEGIN
  -- Loop through each merchant
  FOR merchant_record IN 
    SELECT DISTINCT id FROM merchants WHERE is_active = true
  LOOP
    -- Loop through each date in the range
    FOR date_record IN 
      SELECT generate_series(start_date, CURRENT_DATE, '1 day'::interval)::date
    LOOP
      -- Update analytics for this merchant and date
      PERFORM update_daily_analytics(merchant_record.id, date_record);
      
      -- Log progress
      RAISE NOTICE 'Processed merchant % for date %', merchant_record.id, date_record;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete!';
END $$;

-- Verify the backfill
SELECT 
  merchant_id,
  COUNT(*) as total_days,
  MIN(analytics_date) as earliest_date,
  MAX(analytics_date) as latest_date,
  SUM(new_cards_created) as total_cards,
  SUM(stamps_given) as total_stamps
FROM daily_analytics
GROUP BY merchant_id
ORDER BY merchant_id;
