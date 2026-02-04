const supabase = require('../config/supabase');
const { generateMerchantQRCode } = require('../utils/qrcode');

async function generateQRCodesForExistingMerchants() {
  console.log('🔄 Generating QR codes for existing merchants...\n');

  try {
    // Get all merchants without QR codes
    const { data: merchants, error } = await supabase
      .from('merchants')
      .select('id, name')
      .or('qr_code.is.null,qr_code.eq.');

    if (error) {
      console.error('❌ Error fetching merchants:', error);
      return;
    }

    if (!merchants || merchants.length === 0) {
      console.log('✅ All merchants already have QR codes!');
      return;
    }

    console.log(`📋 Found ${merchants.length} merchant(s) without QR codes\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const merchant of merchants) {
      try {
        console.log(`Generating QR code for: ${merchant.name} (${merchant.id})`);
        
        // Generate QR code
        const qrCode = await generateMerchantQRCode(merchant.id);
        
        // Update merchant with QR code
        const { error: updateError } = await supabase
          .from('merchants')
          .update({ qr_code: qrCode })
          .eq('id', merchant.id);

        if (updateError) {
          console.error(`  ❌ Failed to update: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ QR code generated and saved`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        errorCount++;
      }
      console.log(''); // Empty line for readability
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Successfully generated: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Script error:', error);
  }

  process.exit(0);
}

// Run the script
generateQRCodesForExistingMerchants();
