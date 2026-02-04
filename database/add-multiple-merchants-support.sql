-- Add support for multiple merchants per user

-- Add created_by column to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES merchant_portal_users(id);

-- Update existing merchants to set created_by based on merchant_portal_users
UPDATE merchants m
SET created_by = mpu.id
FROM merchant_portal_users mpu
WHERE m.id = mpu.merchant_id
AND m.created_by IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_merchants_created_by ON merchants(created_by);

-- Add is_active flag to merchants (so we can soft delete)
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add created_at if it doesn't exist
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add updated_at
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
