-- Add qr_code_id column to track the current valid QR code ID
-- When a new QR code is generated, this ID changes, invalidating all previous QR codes

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS qr_code_id UUID;

-- Add index for faster lookups when validating QR codes
CREATE INDEX IF NOT EXISTS idx_merchants_qr_code_id ON merchants(qr_code_id);

-- Add comment for documentation
COMMENT ON COLUMN merchants.qr_code_id IS 'Unique ID of the current valid QR code. Changes when QR code is regenerated, invalidating old codes.';
