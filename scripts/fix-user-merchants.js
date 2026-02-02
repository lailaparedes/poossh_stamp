const supabase = require('../config/supabase');

async function fixUserMerchants() {
  console.log('Checking merchants...\n');
  
  // Get all merchants
  const { data: merchants, error: merchError } = await supabase
    .from('merchants')
    .select('id, name, created_by');
  
  if (merchError) {
    console.error('Error fetching merchants:', merchError);
    process.exit(1);
  }
  
  console.log(`Found ${merchants.length} merchants:\n`);
  merchants.forEach(m => {
    console.log(`- ${m.name} (${m.id})`);
    console.log(`  Created by: ${m.created_by || 'NONE'}\n`);
  });
  
  // Link merchants to users
  console.log('\nLinking merchants to users...\n');
  
  for (const merchant of merchants) {
    if (merchant.created_by) {
      // Update user's merchant_id
      const { error: updateError } = await supabase
        .from('merchant_portal_users')
        .update({ merchant_id: merchant.id })
        .eq('id', merchant.created_by);
      
      if (updateError) {
        console.error(`❌ Failed to link ${merchant.name}:`, updateError.message);
      } else {
        console.log(`✅ Linked ${merchant.name} to user ${merchant.created_by}`);
      }
    }
  }
  
  console.log('\n✅ Done!');
  process.exit(0);
}

fixUserMerchants();
