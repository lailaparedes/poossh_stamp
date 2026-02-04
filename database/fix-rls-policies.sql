-- ============================================
-- FIX RLS POLICIES FOR MERCHANT PORTAL
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the old problematic policies
DROP POLICY IF EXISTS merchant_portal_users_select ON merchant_portal_users;
DROP POLICY IF EXISTS merchant_portal_sessions_select ON merchant_portal_sessions;
DROP POLICY IF EXISTS merchant_dashboard_preferences_select ON merchant_dashboard_preferences;

-- For now, disable RLS on these tables
-- (In production, you'd want proper policies based on JWT claims)
ALTER TABLE merchant_portal_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_portal_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_dashboard_preferences DISABLE ROW LEVEL SECURITY;

-- Verify the changes
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'merchant_portal%';

-- Test: Can we select the user now?
SELECT 
  mpu.id,
  mpu.email,
  mpu.full_name,
  mpu.role,
  m.name as merchant_name
FROM merchant_portal_users mpu
JOIN merchants m ON m.id = mpu.merchant_id
WHERE mpu.email = 'admin@merchant.com';
