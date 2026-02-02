const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');

async function resetPassword() {
  const email = 'jc@mail.com';
  const newPassword = 'password123';
  
  console.log(`Resetting password for ${email}...\n`);
  
  // Hash the new password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Update the user's password
  const { data, error } = await supabase
    .from('merchant_portal_users')
    .update({ password_hash: passwordHash })
    .eq('email', email)
    .select();
  
  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Password reset successfully!');
  console.log('\nYou can now login with:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${newPassword}`);
  
  process.exit(0);
}

resetPassword();
