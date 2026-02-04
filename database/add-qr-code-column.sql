-- Add qr_code column to merchants table to store QR code image as data URL
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Add comment for documentation
COMMENT ON COLUMN merchants.qr_code IS 'Base64 data URL of QR code for customer scanning';
