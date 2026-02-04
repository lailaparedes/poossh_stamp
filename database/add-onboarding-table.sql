-- Add onboarding table to store temporary data during signup
CREATE TABLE IF NOT EXISTS merchant_onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES merchant_portal_users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  phone_number TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS for this table
ALTER TABLE merchant_onboarding_data DISABLE ROW LEVEL SECURITY;

-- Index for faster lookups
CREATE INDEX idx_merchant_onboarding_user_id ON merchant_onboarding_data(user_id);
