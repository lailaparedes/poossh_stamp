const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

async function debugLogin() {
  const email = 'admin@merchant.com';
  const password = 'password123';

  console.log('🔍 Step 1: Looking for user...');
  console.log('   Email:', email);

  // Try to find user (mimicking the login route)
  const { data: user, error: userError } = await supabase
    .from('merchant_portal_users')
    .select(`
      *,
      merchants (
        id,
        name,
        logo,
        category,
        color
      )
    `)
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (userError) {
    console.error('❌ Error finding user:', userError);
    console.log('\n💡 This is the issue! The backend cannot find the user.');
    console.log('   Error code:', userError.code);
    console.log('   Error message:', userError.message);
    
    if (userError.message.includes('row')) {
      console.log('\n🔍 Let me check if user exists without RLS...');
      
      // Try without the merchants join
      const { data: simpleUser, error: simpleError } = await supabase
        .from('merchant_portal_users')
        .select('*')
        .eq('email', email);
      
      if (simpleError) {
        console.log('❌ Still error:', simpleError.message);
      } else if (simpleUser && simpleUser.length > 0) {
        console.log('✅ User exists! Found', simpleUser.length, 'user(s)');
        console.log('   User ID:', simpleUser[0].id);
        console.log('   Merchant ID:', simpleUser[0].merchant_id);
        console.log('   Active:', simpleUser[0].is_active);
        console.log('\n💡 The issue is with the RLS policies on SELECT.');
      } else {
        console.log('❌ User does not exist in database');
      }
    }
    return;
  }

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User found!');
  console.log('   ID:', user.id);
  console.log('   Email:', user.email);
  console.log('   Merchant:', user.merchants?.name);
  console.log('   Active:', user.is_active);

  console.log('\n🔐 Step 2: Verifying password...');
  const validPassword = await bcrypt.compare(password, user.password_hash);
  
  if (validPassword) {
    console.log('✅ Password is correct!');
    console.log('\n🎉 Login should work! The issue might be on the frontend.');
  } else {
    console.log('❌ Password is incorrect!');
    console.log('\n💡 The password hash in the database does not match.');
  }
}

debugLogin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
