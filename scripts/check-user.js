const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

async function checkUser() {
  const email = 'admin@brewandbean.com';

  console.log('🔍 Looking for user:', email);

  // Check if user exists
  const { data: user, error } = await supabase
    .from('merchant_portal_users')
    .select(`
      *,
      merchants (
        id,
        name
      )
    `)
    .eq('email', email)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 User does not exist! You need to create the user first.');
    console.log('\nRun this command to generate the SQL:');
    console.log('  node scripts/generate-user-sql.js');
    console.log('\nThen run the SQL in Supabase SQL Editor.');
    return;
  }

  if (!user) {
    console.log('❌ User not found in database');
    return;
  }

  console.log('\n✅ User found!');
  console.log('   Email:', user.email);
  console.log('   Full Name:', user.full_name);
  console.log('   Role:', user.role);
  console.log('   Merchant:', user.merchants?.name);
  console.log('   Active:', user.is_active);
  console.log('   Created:', user.created_at);

  // Test password
  console.log('\n🔐 Testing password: password123');
  const isValid = await bcrypt.compare('password123', user.password_hash);
  
  if (isValid) {
    console.log('✅ Password is correct!');
    console.log('\n💡 The issue might be with RLS (Row Level Security) policies.');
    console.log('   Try logging in again.');
  } else {
    console.log('❌ Password hash does NOT match!');
    console.log('\n💡 You need to update the password. Run this SQL in Supabase:');
    const newHash = await bcrypt.hash('password123', 10);
    console.log(`
UPDATE merchant_portal_users 
SET password_hash = '${newHash}'
WHERE email = '${email}';
    `);
  }
}

checkUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
