
const supabase = require('../config/supabase');
const { generateMerchantQRCode } = require('../utils/qrcode');

/**
 * Update all existing merchants to have QR codes with unique IDs
 * This will generate new QR codes for all merchants that don't have a qr_code_id
 */
async function updateExistingQRCodes() {
  console.log('🔄 Updating existing QR codes with unique IDs...\n');

  try {
    // Get all merchants that have qr_code but no qr_code_id
    const { data: merchants, error } = await supabase
      .from('merchants')
      .select('id, name, qr_code')
      .is('qr_code_id', null)
      .not('qr_code', 'is', null);

    if (error) {
      console.error('❌ Error fetching merchants:', error);
      return;
    }

    if (!merchants || merchants.length === 0) {
      console.log('✅ All merchants already have QR code IDs!');
      return;
    }

    console.log(`📋 Found ${merchants.length} merchant(s) needing QR code ID update\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const merchant of merchants) {
      try {
        console.log(`Regenerating QR code for: ${merchant.name} (${merchant.id})`);
        
        // Generate new QR code with unique ID
        const { qrCodeDataUrl, qrCodeId } = await generateMerchantQRCode(merchant.id);
        
        // Update merchant with new QR code and ID
        const { error: updateError } = await supabase
          .from('merchants')
          .update({ 
            qr_code: qrCodeDataUrl,
            qr_code_id: qrCodeId
          })
          .eq('id', merchant.id);

        if (updateError) {
          console.error(`  ❌ Failed to update: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ QR code regenerated with ID: ${qrCodeId}`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        errorCount++;
      }
      console.log('');
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('='.repeat(60));
    console.log('\n⚠️  IMPORTANT: All previous QR codes are now invalid!');
    console.log('Merchants should reprint and display the new QR codes.\n');

  } catch (error) {
    console.error('❌ Script error:', error);
  }

  process.exit(0);
}

// Run the script
updateExistingQRCodes();
