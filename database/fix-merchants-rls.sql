-- Disable RLS on merchants table to allow new merchants to be created
ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'merchants';
