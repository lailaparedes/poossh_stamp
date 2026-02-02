const bcrypt = require('bcrypt');

async function generateSQL() {
  // CHANGE THESE VALUES
  const email = 'admin@brewandbean.com';
  const password = 'password123';
  const fullName = 'Brew & Bean Admin';
  const role = 'owner';
  
  // You'll need to replace this with actual merchant ID from your database
  const merchantName = 'Brew & Bean';

  console.log('🔐 Generating bcrypt hash for password:', password);
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('\n✅ Password hashed successfully!');
  console.log('\n📋 Copy and paste this SQL into Supabase SQL Editor:\n');
  console.log('----------------------------------------\n');
  
  const sql = `
-- Create merchant portal user for ${merchantName}
INSERT INTO merchant_portal_users (merchant_id, email, password_hash, full_name, role)
SELECT 
  id,
  '${email}',
  '${passwordHash}',
  '${fullName}',
  '${role}'
FROM merchants 
WHERE name = '${merchantName}'
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

-- Verify the user was created
SELECT 
  mpu.id,
  mpu.email,
  mpu.full_name,
  mpu.role,
  m.name as merchant_name
FROM merchant_portal_users mpu
JOIN merchants m ON m.id = mpu.merchant_id
WHERE mpu.email = '${email}';
`;

  console.log(sql);
  console.log('----------------------------------------\n');
  console.log('📝 Login Credentials:');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   Merchant:', merchantName);
  console.log('\n🎯 Next: Run the SQL above in Supabase SQL Editor');
}

generateSQL().catch(console.error);
