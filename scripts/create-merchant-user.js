const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');

async function createMerchantUser() {
  // User details
  const email = 'admin@brewandbean.com';
  const password = 'password123'; // Change this!
  const fullName = 'Brew & Bean Admin';
  const role = 'owner';

  // Find a merchant (using Brew & Bean as example)
  console.log('🔍 Finding merchant...');
  const { data: merchants, error: merchantError } = await supabase
    .from('merchants')
    .select('id, name')
    .limit(5);

  if (merchantError) {
    console.error('❌ Error fetching merchants:', merchantError.message);
    return;
  }

  if (!merchants || merchants.length === 0) {
    console.error('❌ No merchants found in database');
    return;
  }

  console.log('\n📋 Available merchants:');
  merchants.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.name} (${m.id})`);
  });

  // Use first merchant for demo
  const merchantId = merchants[0].id;
  const merchantName = merchants[0].name;

  // Hash password
  console.log('\n🔐 Hashing password...');
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert user
  console.log('👤 Creating merchant portal user...');
  const { data: user, error: userError } = await supabase
    .from('merchant_portal_users')
    .insert([
      {
        merchant_id: merchantId,
        email: email,
        password_hash: passwordHash,
        full_name: fullName,
        role: role,
        is_active: true
      }
    ])
    .select()
    .single();

  if (userError) {
    console.error('❌ Error creating user:', userError.message);
    
    // If email already exists, show update SQL
    if (userError.code === '23505') {
      console.log('\n💡 User already exists. To update password, run this SQL:');
      console.log(`
UPDATE merchant_portal_users 
SET password_hash = '${passwordHash}'
WHERE email = '${email}';
      `);
    }
    return;
  }

  console.log('\n✅ Successfully created merchant portal user!');
  console.log('\n📋 Login Credentials:');
  console.log('   Merchant:', merchantName);
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   Role:', role);
  console.log('\n💾 User ID:', user.id);
  console.log('\n🎉 You can now use these credentials to log in!');
}

// Run the script
createMerchantUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
