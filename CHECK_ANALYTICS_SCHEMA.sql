-- First, let's see what columns actually exist in merchant_card_analytics
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'merchant_card_analytics'
ORDER BY ordinal_position;

-- Check what data is in the table
SELECT * FROM merchant_card_analytics LIMIT 5;

-- Check merchant_cards structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'merchant_cards'
ORDER BY ordinal_position;

-- Check stamp_history structure  
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'stamp_history'
ORDER BY ordinal_position;

-- Check stamp_cards structure
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'stamp_cards'
ORDER BY ordinal_position;
