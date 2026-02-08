-- Check if merchant_card_analytics table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'merchant_card_analytics'
) as analytics_table_exists;

-- List all tables in your database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- If it doesn't exist, check what you DO have:
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE '%analy%' OR table_name LIKE '%merchant%'
ORDER BY table_name, ordinal_position;
