-- Add common_merchant_id to group merchants under same business
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS common_merchant_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_merchants_common_merchant_id ON merchants(common_merchant_id);

-- For existing merchants, set common_merchant_id to their own id initially
UPDATE merchants 
SET common_merchant_id = id::text 
WHERE common_merchant_id IS NULL;

COMMENT ON COLUMN merchants.common_merchant_id IS 'Groups multiple merchant locations/cards under the same business. Used for search and display grouping.';
