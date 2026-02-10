const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticateMerchant = require('../middleware/auth');
const { generateMerchantQRCode } = require('../utils/qrcode');

// Get all merchants (admin - returns all)
router.get('/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('merchant_cards')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching merchants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all merchants for the current user (Protected)
router.get('/', authenticateMerchant, async (req, res) => {
  try {
    const { userId } = req.merchant;
    console.log('Fetching merchants for user:', userId);

    const { data, error } = await supabase
      .from('merchant_cards')
      .select('*')
      .eq('created_by_user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user merchants:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} merchants`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching merchants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint to check QR code uniqueness (for debugging) - MUST BE BEFORE /:merchantId
router.get('/test-qr-uniqueness', async (req, res) => {
  try {
    // Get all active cards with their QR code IDs
    const { data: cards, error } = await supabase
      .from('merchant_cards')
      .select('id, name, qr_code_id, common_merchant_id')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Check for duplicates
    const qrCodeMap = {};
    const duplicates = [];

    cards.forEach(card => {
      if (card.qr_code_id) {
        if (qrCodeMap[card.qr_code_id]) {
          duplicates.push({
            qr_code_id: card.qr_code_id,
            cards: [qrCodeMap[card.qr_code_id], card.name]
          });
        } else {
          qrCodeMap[card.qr_code_id] = card.name;
        }
      }
    });

    res.json({
      success: true,
      total_cards: cards.length,
      unique_qr_codes: Object.keys(qrCodeMap).length,
      cards_without_qr: cards.filter(c => !c.qr_code_id).length,
      duplicates: duplicates,
      all_cards: cards.map(c => ({
        id: c.id,
        name: c.name,
        qr_code_id: c.qr_code_id || 'MISSING',
        qr_id_preview: c.qr_code_id ? c.qr_code_id.substring(0, 8) + '...' : 'MISSING'
      }))
    });
  } catch (error) {
    console.error('QR uniqueness check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get merchant by ID
router.get('/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;

    const { data, error } = await supabase
      .from('merchant_cards')
      .select('*')
      .eq('id', merchantId)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching merchant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create loyalty program for new merchant (Protected)
router.post('/create-loyalty-program', authenticateMerchant, async (req, res) => {
  try {
    console.log('=== CREATE LOYALTY PROGRAM START ===');
    const { userId } = req.merchant;
    const { cardName, stampsRequired, rewardDescription, color, logo } = req.body;
    
    console.log('User ID:', userId);
    console.log('Request body:', { cardName, stampsRequired, rewardDescription, color, logo });

    // Get user data (including business_name)
    console.log('Fetching user data...');
    const { data: userData, error: userError } = await supabase
      .from('portal_merchant_users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('User query result:', { data: userData ? 'found' : 'not found', error: userError });

    if (userError || !userData) {
      console.error('User data not found:', userError);
      return res.status(400).json({
        success: false,
        error: 'User data not found. Please try logging in again.'
      });
    }

    // Check subscription plan and card limits
    const userPlan = userData.subscription_plan;
    console.log('User plan:', userPlan);

    if (userPlan === 'starter') {
      // Check existing card count for Starter plan
      const { data: existingCards, error: countError } = await supabase
        .from('merchant_cards')
        .select('id')
        .eq('created_by_user_id', userId)
        .eq('is_active', true);

      if (countError) {
        console.error('Error checking card count:', countError);
      }

      const cardCount = existingCards?.length || 0;
      console.log('Current active card count:', cardCount);

      if (cardCount >= 2) {
        console.log('❌ Starter plan limit reached (2 cards)');
        return res.status(403).json({
          success: false,
          error: 'You have reached the maximum number of cards for Starter plan (2 cards). Upgrade to Pro for unlimited cards.',
          needsUpgrade: true
        });
      }
    }

    // Create merchant in merchants table
    const businessName = userData.business_name || userData.name || 'My Business';
    const category = 'Other'; // Default category
    
    // Get user's existing merchants to check for common_merchant_id
    const { data: existingMerchants } = await supabase
      .from('merchant_cards')
      .select('common_merchant_id')
      .eq('created_by_user_id', userId)
      .not('common_merchant_id', 'is', null)
      .limit(1);
    
    // Use existing common_merchant_id or create new one based on user ID
    const commonMerchantId = existingMerchants?.[0]?.common_merchant_id || `merchant-${userId}`;
    
    console.log('Creating merchant with data:', {
      name: businessName,
      card_name: cardName || businessName,
      logo: logo || '🏪',
      category: category,
      stamps_required: stampsRequired,
      reward_description: rewardDescription,
      color: color,
      common_merchant_id: commonMerchantId
    });

    const { data: newMerchant, error: merchantError } = await supabase
      .from('merchant_cards')
      .insert([{
        name: businessName,
        card_name: cardName || businessName, // Customer-facing name
        logo: logo || '🏪',
        category: category,
        stamps_required: stampsRequired,
        reward_description: rewardDescription,
        color: color,
        created_by_user_id: userId,
        is_active: true,
        common_merchant_id: commonMerchantId
      }])
      .select()
      .single();

    console.log('Merchant creation result:', { data: newMerchant, error: merchantError });

    if (merchantError) {
      console.error('❌ Merchant creation error:', merchantError);
      return res.status(500).json({
        success: false,
        error: `Failed to create merchant: ${merchantError.message}`
      });
    }

    console.log('✅ Merchant created:', newMerchant.id);

    // Generate QR code for the merchant
    console.log('Generating QR code for merchant...');
    const { qrCodeDataUrl, qrCodeId } = await generateMerchantQRCode(newMerchant.id);
    
    // Update merchant with QR code and QR code ID
    const { error: qrUpdateError } = await supabase
      .from('merchant_cards')
      .update({ 
        qr_code: qrCodeDataUrl,
        qr_code_id: qrCodeId
      })
      .eq('id', newMerchant.id);
    
    if (qrUpdateError) {
      console.error('⚠️ QR code update error:', qrUpdateError);
      // Don't fail the whole request if QR code fails
    } else {
      console.log('✅ QR code generated and saved with ID:', qrCodeId);
      newMerchant.qr_code = qrCodeDataUrl; // Add to response
      newMerchant.qr_code_id = qrCodeId;
    }

    // Update merchant_portal_users with the new merchant_id
    console.log('Updating user with merchant_id...');
    const { error: updateError } = await supabase
      .from('portal_merchant_users')
      .update({ merchant_id: newMerchant.id })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return res.status(500).json({
        success: false,
        error: `Failed to link merchant to user: ${updateError.message}`
      });
    }

    console.log('✅ User updated with merchant_id');
    console.log('=== CREATE LOYALTY PROGRAM SUCCESS ===');
    
    // Generate new JWT token with updated merchantId
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    const newToken = jwt.sign(
      { 
        userId: userId,
        merchantId: newMerchant.id,
        email: req.merchant.email,
        role: req.merchant.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ New token generated with merchantId:', newMerchant.id);
    
    // Update session in database with new token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    // Delete old sessions for this user
    await supabase
      .from('merchant_portal_sessions')
      .delete()
      .eq('user_id', userId);
    
    // Create new session with updated token
    const { error: sessionError } = await supabase
      .from('merchant_portal_sessions')
      .insert([{
        user_id: userId,
        merchant_id: newMerchant.id,
        token: newToken,
        expires_at: expiresAt.toISOString()
      }]);
    
    if (sessionError) {
      console.error('Session creation error:', sessionError);
    } else {
      console.log('✅ Session updated in database');
    }
    
    res.json({
      success: true,
      data: { 
        merchant: newMerchant,
        token: newToken 
      }
    });
  } catch (error) {
    console.error('❌ Create loyalty program error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create loyalty program'
    });
  }
});

// Create a new loyalty card (for existing users who want multiple cards)
router.post('/create', authenticateMerchant, async (req, res) => {
  try {
    console.log('=== CREATE NEW LOYALTY CARD ===');
    const { userId } = req.merchant;
    const { businessName, cardName, category, stampsRequired, rewardDescription, color, logo } = req.body;
    
    console.log('Creating merchant:', { businessName, cardName, category, stampsRequired, rewardDescription, color, logo });

    // Get user data to check subscription plan
    const { data: userPlanData, error: planError } = await supabase
      .from('portal_merchant_users')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    if (planError || !userPlanData) {
      return res.status(400).json({
        success: false,
        error: 'User data not found.'
      });
    }

    // Check subscription plan and card limits
    const userPlan = userPlanData.subscription_plan;
    console.log('User plan:', userPlan);

    if (userPlan === 'starter') {
      // Check existing card count for Starter plan
      const { data: existingCards, error: countError } = await supabase
        .from('merchant_cards')
        .select('id')
        .eq('created_by_user_id', userId)
        .eq('is_active', true);

      if (countError) {
        console.error('Error checking card count:', countError);
      }

      const cardCount = existingCards?.length || 0;
      console.log('Current active card count:', cardCount);

      if (cardCount >= 2) {
        console.log('❌ Starter plan limit reached (2 cards)');
        return res.status(403).json({
          success: false,
          error: 'You have reached the maximum number of cards for Starter plan (2 cards). Upgrade to Pro for unlimited cards.',
          needsUpgrade: true
        });
      }
    }

    // Get user's existing merchants to check for common_merchant_id
    const { data: existingMerchants } = await supabase
      .from('merchant_cards')
      .select('common_merchant_id')
      .eq('created_by_user_id', userId)
      .not('common_merchant_id', 'is', null)
      .limit(1);
    
    // Use existing common_merchant_id or create new one based on user ID
    const commonMerchantId = existingMerchants?.[0]?.common_merchant_id || `merchant-${userId}`;
    
    console.log('Using common_merchant_id:', commonMerchantId);

    // Create merchant
    const { data: newMerchant, error: merchantError } = await supabase
      .from('merchant_cards')
      .insert([{
        name: businessName,
        card_name: cardName || businessName, // Customer-facing name
        logo: logo || '🏪',
        category: category,
        stamps_required: stampsRequired,
        reward_description: rewardDescription,
        color: color,
        created_by_user_id: userId,
        is_active: true,
        common_merchant_id: commonMerchantId
      }])
      .select()
      .single();

    if (merchantError) {
      console.error('❌ Merchant creation error:', merchantError);
      return res.status(500).json({
        success: false,
        error: `Failed to create merchant: ${merchantError.message}`
      });
    }

    console.log('✅ Merchant created:', newMerchant.id);

    // Generate QR code for the merchant
    console.log('Generating QR code for merchant...');
    const { qrCodeDataUrl, qrCodeId } = await generateMerchantQRCode(newMerchant.id);
    
    // Update merchant with QR code and QR code ID
    const { error: qrUpdateError } = await supabase
      .from('merchant_cards')
      .update({ 
        qr_code: qrCodeDataUrl,
        qr_code_id: qrCodeId
      })
      .eq('id', newMerchant.id);
    
    if (qrUpdateError) {
      console.error('⚠️ QR code update error:', qrUpdateError);
    } else {
      console.log('✅ QR code generated and saved with ID:', qrCodeId);
      newMerchant.qr_code = qrCodeDataUrl;
      newMerchant.qr_code_id = qrCodeId;
    }

    // Set as active merchant if user doesn't have one
    const { data: userData } = await supabase
      .from('portal_merchant_users')
      .select('merchant_id')
      .eq('id', userId)
      .single();

    if (!userData?.merchant_id) {
      await supabase
        .from('portal_merchant_users')
        .update({ merchant_id: newMerchant.id })
        .eq('id', userId);
    }

    res.json({
      success: true,
      data: { merchant: newMerchant }
    });
  } catch (error) {
    console.error('❌ Create merchant error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create merchant'
    });
  }
});

// Set active merchant (which merchant to show in dashboard)
router.post('/set-active/:merchantId', authenticateMerchant, async (req, res) => {
  try {
    const { userId } = req.merchant;
    const { merchantId } = req.params;

    console.log('\n=== SET ACTIVE MERCHANT ===');
    console.log('User ID:', userId);
    console.log('Requested merchant ID:', merchantId);
    console.log('Current merchant ID:', req.merchant.merchantId);

    // Verify merchant belongs to user
    const { data: merchant, error: fetchError } = await supabase
      .from('merchant_cards')
      .select('*')
      .eq('id', merchantId)
      .eq('created_by_user_id', userId)
      .eq('is_active', true)
      .single();

    console.log('🔍 Fetched merchant:', merchant?.name, 'ID:', merchant?.id);

    if (fetchError || !merchant) {
      console.log('❌ Merchant fetch error:', fetchError);
      return res.status(404).json({
        success: false,
        error: 'Merchant not found or does not belong to you'
      });
    }

    // Update user's active merchant
    console.log('🔄 Updating user merchant_id in database to:', merchantId, '(' + merchant.name + ')');
    const { data: updateData, error: updateError } = await supabase
      .from('portal_merchant_users')
      .update({ merchant_id: merchantId })
      .eq('id', userId)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to set active merchant'
      });
    }

    console.log('✅ Database updated:', updateData);
    console.log('✅ Active merchant changed from', req.merchant.merchantId, 'to', merchantId, '(' + merchant.name + ')');
    
    // Generate new JWT token with updated merchantId
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    const tokenPayload = { 
      userId: userId,
      merchantId: merchantId,
      email: req.merchant.email,
      role: req.merchant.role
    };
    
    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('🎫 New JWT token generated with payload:', tokenPayload);
    console.log('🎫 Token will return merchant:', merchant.name, 'ID:', merchantId);
    console.log('Token preview:', newToken.substring(0, 50) + '...');
    
    // Update session in database with new token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    // Delete old sessions for this user
    await supabase
      .from('merchant_portal_sessions')
      .delete()
      .eq('user_id', userId);
    
    // Create new session with updated token
    const { error: sessionError } = await supabase
      .from('merchant_portal_sessions')
      .insert([{
        user_id: userId,
        merchant_id: merchantId,
        token: newToken,
        expires_at: expiresAt.toISOString()
      }]);
    
    if (sessionError) {
      console.error('Session creation error:', sessionError);
    } else {
      console.log('✅ Session updated in database');
    }
    
    console.log('✅ SET ACTIVE MERCHANT SUCCESS - Returning merchant:', merchant.name, 'ID:', merchant.id);
    console.log('=== END SET ACTIVE MERCHANT ===\n');
    
    res.json({
      success: true,
      data: { 
        merchant,
        token: newToken 
      }
    });
  } catch (error) {
    console.error('❌ Set active merchant error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to set active merchant'
    });
  }
});

// Generate/regenerate QR code for a merchant
// IMPORTANT: Regenerating invalidates ALL previous QR codes for this merchant
router.post('/generate-qr/:merchantId', authenticateMerchant, async (req, res) => {
  try {
    const { userId } = req.merchant;
    const { merchantId } = req.params;

    console.log('🔄 Regenerating QR code for merchant:', merchantId);

    // Verify the merchant belongs to this user
    const { data: merchant, error: fetchError } = await supabase
      .from('merchant_cards')
      .select('*')
      .eq('id', merchantId)
      .eq('created_by_user_id', userId)
      .single();

    if (fetchError || !merchant) {
      console.error('❌ Merchant not found:', fetchError);
      return res.status(404).json({
        success: false,
        error: 'Merchant not found or you do not have permission to access it'
      });
    }

    // Generate new QR code with unique ID
    // This invalidates all previous QR codes
    const { qrCodeDataUrl, qrCodeId } = await generateMerchantQRCode(merchantId);
    
    console.log('✅ New QR code generated with ID:', qrCodeId);
    console.log('⚠️  All previous QR codes are now INVALID');
    
    // Update merchant with new QR code and ID
    const { error: updateError } = await supabase
      .from('merchant_cards')
      .update({ 
        qr_code: qrCodeDataUrl,
        qr_code_id: qrCodeId
      })
      .eq('id', merchantId);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw new Error('Failed to save QR code to database');
    }

    console.log('✅ QR code saved to database');

    res.json({
      success: true,
      message: 'QR code regenerated successfully. Previous QR codes are now invalid.',
      data: { 
        qr_code: qrCodeDataUrl,
        qr_code_id: qrCodeId
      }
    });
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate QR code. Please try again.'
    });
  }
});

// Debug endpoint: Get merchant info by ID (for mobile app testing)
router.get('/debug/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;

    const { data: merchant, error } = await supabase
      .from('merchant_cards')
      .select('id, name, qr_code_id, stamps_required, reward_description, is_active, common_merchant_id')
      .eq('id', merchantId)
      .single();

    if (error || !merchant) {
      return res.json({
        success: false,
        error: 'Merchant not found'
      });
    }

    res.json({
      success: true,
      merchant: merchant,
      qr_preview: merchant.qr_code_id ? merchant.qr_code_id.substring(0, 12) + '...' : 'MISSING'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate QR code (for PunchMe app to check if scanned QR code is valid)
router.post('/validate-qr', async (req, res) => {
  try {
    const { merchantId, qrCodeId } = req.body;

    if (!merchantId || !qrCodeId) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Missing merchantId or qrCodeId'
      });
    }

    console.log('🔍 Validating QR code:', { merchantId, qrCodeId });

    // Get merchant and check if QR code ID matches
    const { data: merchant, error } = await supabase
      .from('merchant_cards')
      .select('id, name, qr_code_id, stamps_required, reward_description, color, logo, category')
      .eq('id', merchantId)
      .eq('is_active', true)
      .single();

    if (error || !merchant) {
      console.log('❌ Merchant not found');
      return res.json({
        success: true,
        valid: false,
        error: 'Merchant not found or inactive'
      });
    }

    // STRICT validation: Both IDs must exist AND match exactly
    if (!merchant.qr_code_id) {
      console.log('❌ Card has no QR code ID in database');
      return res.json({
        success: true,
        valid: false,
        error: 'This card does not have a valid QR code. Please contact the merchant.'
      });
    }

    if (!qrCodeId) {
      console.log('❌ QR code missing validation ID');
      return res.json({
        success: true,
        valid: false,
        error: 'Invalid QR code format'
      });
    }

    // Check if QR code ID matches EXACTLY (strict string comparison)
    const isValid = merchant.qr_code_id === qrCodeId;

    console.log('🔍 QR Validation Check:');
    console.log('  Card ID:', merchant.id);
    console.log('  Card Name:', merchant.name);
    console.log('  Expected QR ID:', merchant.qr_code_id);
    console.log('  Scanned QR ID:', qrCodeId);
    console.log('  Match:', isValid);

    if (isValid) {
      console.log('✅ QR code is VALID for card:', merchant.name);
      return res.json({
        success: true,
        valid: true,
        merchant: {
          id: merchant.id,
          name: merchant.card_name || merchant.name, // Use card_name (customer-facing) or fallback to name
          businessName: merchant.name, // Internal business name
          logo: merchant.logo,
          category: merchant.category,
          stampsRequired: merchant.stamps_required,
          rewardDescription: merchant.reward_description,
          color: merchant.color
        }
      });
    } else {
      console.log('❌ QR code is INVALID - ID mismatch for card:', merchant.name);
      console.log('  This QR code belongs to a different card or has been regenerated');
      return res.json({
        success: true,
        valid: false,
        error: 'This QR code has been replaced or belongs to a different card. Please scan the latest QR code.'
      });
    }
  } catch (error) {
    console.error('❌ QR validation error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      error: 'Failed to validate QR code'
    });
  }
});

// Delete merchant (soft delete)
router.delete('/:merchantId', authenticateMerchant, async (req, res) => {
  try {
    const { userId } = req.merchant;
    const { merchantId } = req.params;

    console.log(`Deleting merchant ${merchantId} for user ${userId}`);

    // Verify merchant belongs to user
    const { data: merchant, error: fetchError } = await supabase
      .from('merchant_cards')
      .select('*')
      .eq('id', merchantId)
      .eq('created_by_user_id', userId)
      .single();

    if (fetchError || !merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found or does not belong to you'
      });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('merchant_cards')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', merchantId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete merchant'
      });
    }

    // If this was the active merchant, unset it
    const { data: userData } = await supabase
      .from('portal_merchant_users')
      .select('merchant_id')
      .eq('id', userId)
      .single();

    if (userData?.merchant_id === merchantId) {
      // Get first remaining active merchant
      const { data: remainingMerchants } = await supabase
        .from('merchant_cards')
        .select('id')
        .eq('created_by_user_id', userId)
        .eq('is_active', true)
        .limit(1);

      const newActiveMerchant = remainingMerchants?.[0]?.id || null;

      await supabase
        .from('portal_merchant_users')
        .update({ merchant_id: newActiveMerchant })
        .eq('id', userId);
    }

    console.log('✅ Merchant deleted');
    res.json({
      success: true,
      message: 'Merchant deleted successfully'
    });
  } catch (error) {
    console.error('Delete merchant error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete merchant'
    });
  }
});

// Update merchant card
router.put('/:merchantId', authenticateMerchant, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { businessName, cardName, stampsRequired, logo, color } = req.body;
    const userId = req.merchant.userId;

    console.log('📝 Updating merchant:', merchantId, 'User:', userId);
    console.log('Request body:', { businessName, cardName, stampsRequired, logo, color });

    // Validate required fields
    if (!businessName) {
      return res.status(400).json({
        success: false,
        error: 'Business name is required'
      });
    }

    if (stampsRequired && (stampsRequired < 5 || stampsRequired > 20)) {
      return res.status(400).json({
        success: false,
        error: 'Stamps required must be between 5 and 20'
      });
    }

    // Verify merchant exists and belongs to user
    const { data: existingMerchant, error: checkError } = await supabase
      .from('merchant_cards')
      .select('*')
      .eq('id', merchantId)
      .eq('is_active', true)
      .single();

    if (checkError) {
      console.error('Check merchant error:', checkError);
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    if (!existingMerchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    console.log('Existing merchant:', existingMerchant);
    console.log('Created by:', existingMerchant.created_by_user_id, 'User ID:', userId);

    if (existingMerchant.created_by_user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this merchant'
      });
    }

    // Prepare update data
    const updateData = {
      name: businessName,  // Column is 'name' not 'business_name'
      updated_at: new Date().toISOString()
    };

    if (cardName) {
      updateData.card_name = cardName;
    }

    if (stampsRequired) {
      updateData.stamps_required = stampsRequired;
    }

    if (logo) {
      updateData.logo = logo;
    }

    if (color) {
      updateData.color = color;
    }

    console.log('Update data:', updateData);

    // Update merchant
    const { data: updatedMerchant, error: updateError } = await supabase
      .from('merchant_cards')
      .update(updateData)
      .eq('id', merchantId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update merchant'
      });
    }

    console.log('✅ Merchant updated successfully:', updatedMerchant);
    res.json({
      success: true,
      message: 'Card updated successfully',
      data: updatedMerchant
    });
  } catch (error) {
    console.error('Update merchant error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update merchant'
    });
  }
});

module.exports = router;
