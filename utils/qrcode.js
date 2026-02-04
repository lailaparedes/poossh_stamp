const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a QR code as a data URL for a merchant
 * @param {string} merchantId - The unique merchant ID
 * @returns {Promise<{qrCodeDataUrl: string, qrCodeId: string}>} QR code data URL and unique ID
 */
async function generateMerchantQRCode(merchantId) {
  try {
    // Generate unique QR code ID - this invalidates all previous QR codes
    const qrCodeId = uuidv4();
    
    // Create QR code data - encode the merchant ID and QR code ID
    // The PunchMe app will validate both the merchantId and qrCodeId
    const qrData = {
      type: 'PUNCHME_MERCHANT',
      merchantId: merchantId,
      qrCodeId: qrCodeId, // Unique ID - must match database to be valid
      timestamp: new Date().toISOString()
    };

    // Generate QR code as data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H', // High error correction
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 400 // Size in pixels
    });

    return { qrCodeDataUrl, qrCodeId };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

module.exports = {
  generateMerchantQRCode
};
