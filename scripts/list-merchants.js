const supabase = require('../config/supabase');

async function listMerchants() {
  console.log('📋 Fetching merchants from database...\n');

  const { data: merchants, error } = await supabase
    .from('merchants')
    .select('id, name')
    .limit(10);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!merchants || merchants.length === 0) {
    console.log('❌ No merchants found in database');
    return;
  }

  console.log('✅ Found', merchants.length, 'merchants:\n');
  merchants.forEach((m, i) => {
    console.log(`${i + 1}. ${m.name}`);
    console.log(`   ID: ${m.id}\n`);
  });

  // Use first merchant for SQL
  const merchant = merchants[0];
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('📝 SQL to create user for:', merchant.name);
  console.log('─'.repeat(60));
  console.log(`
-- DISABLE RLS temporarily to insert user
ALTER TABLE merchant_portal_users DISABLE ROW LEVEL SECURITY;

-- Insert user
INSERT INTO merchant_portal_users (merchant_id, email, password_hash, full_name, role, is_active)
VALUES (
  '${merchant.id}',
  'admin@merchant.com',
  '${passwordHash}',
  '${merchant.name} Admin',
  'owner',
  true
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

-- RE-ENABLE RLS
ALTER TABLE merchant_portal_users ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  mpu.id,
  mpu.email,
  mpu.full_name,
  mpu.role,
  mpu.is_active,
  m.name as merchant_name
FROM merchant_portal_users mpu
JOIN merchants m ON m.id = mpu.merchant_id
WHERE mpu.email = 'admin@merchant.com';
  `);
  console.log('─'.repeat(60));
  console.log('\n📧 Login with:');
  console.log('   Email: admin@merchant.com');
  console.log('   Password: password123');
}

listMerchants()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
