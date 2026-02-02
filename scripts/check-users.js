const supabase = require('../config/supabase');

async function checkUsers() {
  console.log('Checking merchant_portal_users table...\n');
  
  const { data, error } = await supabase
    .from('merchant_portal_users')
    .select('id, email, full_name, merchant_id, is_active');
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Found', data.length, 'users:\n');
    data.forEach(user => {
      console.log(`- Email: ${user.email}`);
      console.log(`  Name: ${user.full_name}`);
      console.log(`  Merchant ID: ${user.merchant_id || 'NONE'}`);
      console.log(`  Active: ${user.is_active}`);
      console.log('');
    });
  }
  
  process.exit(0);
}

checkUsers();
