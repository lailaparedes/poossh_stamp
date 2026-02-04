-- Fix: Allow merchant_id to be NULL for new signups
-- They will set it when they create their loyalty program

ALTER TABLE merchant_portal_users 
ALTER COLUMN merchant_id DROP NOT NULL;

-- Verify the change
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns
WHERE table_name = 'merchant_portal_users' 
AND column_name = 'merchant_id';
