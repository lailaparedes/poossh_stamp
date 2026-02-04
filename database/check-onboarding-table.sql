-- Check if onboarding table exists and has data
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'merchant_onboarding_data';

-- If it exists, check for data
SELECT * FROM merchant_onboarding_data ORDER BY created_at DESC LIMIT 5;
