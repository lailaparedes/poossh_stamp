const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticateMerchant = require('../middleware/auth');
const { generateMerchantQRCode } = require('../utils/qrcode');

// Get all merchants (admin - returns all)
router.get('/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('merchants')
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
      .from('merchants')
      .select('*')
      .eq('created_by', userId)
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

// Get merchant by ID
router.get('/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;

    const { data, error } = await supabase
      .from('merchants')
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
    const { stampsRequired, rewardDescription, color, logo } = req.body;
    
    console.log('User ID:', userId);
    console.log('Request body:', { stampsRequired, rewardDescription, color, logo });

    // Get user data (including business_name)
    console.log('Fetching user data...');
    const { data: userData, error: userError } = await supabase
      .from('merchant_portal_users')
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
        .from('merchants')
        .select('id')
        .eq('created_by', userId)
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
    const businessName = userData.business_name || userData.full_name || 'My Business';
    const category = 'Other'; // Default category
    
    console.log('Creating merchant with data:', {
      name: businessName,
      logo: logo || '🏪',
      category: category,
      stamps_required: stampsRequired,
      reward_description: rewardDescription,
      color: color
    });

    const { data: newMerchant, error: merchantError } = await supabase
      .from('merchants')
      .insert([{
        name: businessName,
        logo: logo || '🏪',
        category: category,
        stamps_required: stampsRequired,
        reward_description: rewardDescription,
        color: color,
        created_by: userId,
        is_active: true
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
      .from('merchants')
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
      .from('merchant_portal_users')
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
    const { businessName, category, stampsRequired, rewardDescription, color, logo } = req.body;
    
    console.log('Creating merchant:', { businessName, category, stampsRequired, rewardDescription, color, logo });

    // Get user data to check subscription plan
    const { data: userData, error: userError } = await supabase
      .from('merchant_portal_users')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(400).json({
        success: false,
        error: 'User data not found.'
      });
    }

    // Check subscription plan and card limits
    const userPlan = userData.subscription_plan;
    console.log('User plan:', userPlan);

    if (userPlan === 'starter') {
      // Check existing card count for Starter plan
      const { data: existingCards, error: countError } = await supabase
        .from('merchants')
        .select('id')
        .eq('created_by', userId)
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
      .from('merchants')
      .select('common_merchant_id')
      .eq('created_by', userId)
      .not('common_merchant_id', 'is', null)
      .limit(1);
    
    // Use existing common_merchant_id or create new one based on user ID
    const commonMerchantId = existingMerchants?.[0]?.common_merchant_id || `merchant-${userId}`;
    
    console.log('Using common_merchant_id:', commonMerchantId);

    // Create merchant
    const { data: newMerchant, error: merchantError } = await supabase
      .from('merchants')
      .insert([{
        name: businessName,
        logo: logo || '🏪',
        category: category,
        stamps_required: stampsRequired,
        reward_description: rewardDescription,
        color: color,
        created_by: userId,
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
      .from('merchants')
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
      .from('merchant_portal_users')
      .select('merchant_id')
      .eq('id', userId)
      .single();

    if (!userData?.merchant_id) {
      await supabase
        .from('merchant_portal_users')
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
      .from('merchants')
      .select('*')
      .eq('id', merchantId)
      .eq('created_by', userId)
      .eq('is_active', true)
      .single();

    if (fetchError || !merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found or does not belong to you'
      });
    }

    // Update user's active merchant
    console.log('Updating user merchant_id in database...');
    const { data: updateData, error: updateError } = await supabase
      .from('merchant_portal_users')
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
    console.log('✅ Active merchant changed from', req.merchant.merchantId, 'to', merchantId);
    
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
    
    console.log('✅ New JWT token generated with payload:', tokenPayload);
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
    
    console.log('=== SET ACTIVE MERCHANT SUCCESS ===\n');
    
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
      .from('merchants')
      .select('*')
      .eq('id', merchantId)
      .eq('created_by', userId)
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
      .from('merchants')
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
      .from('merchants')
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

    // Check if QR code ID matches
    const isValid = merchant.qr_code_id === qrCodeId;

    if (isValid) {
      console.log('✅ QR code is VALID');
      return res.json({
        success: true,
        valid: true,
        merchant: {
          id: merchant.id,
          name: merchant.name,
          logo: merchant.logo,
          category: merchant.category,
          stampsRequired: merchant.stamps_required,
          rewardDescription: merchant.reward_description,
          color: merchant.color
        }
      });
    } else {
      console.log('❌ QR code is INVALID - ID mismatch');
      console.log('Expected:', merchant.qr_code_id);
      console.log('Received:', qrCodeId);
      return res.json({
        success: true,
        valid: false,
        error: 'This QR code has been replaced. Please scan the latest QR code from the merchant.'
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
      .from('merchants')
      .select('*')
      .eq('id', merchantId)
      .eq('created_by', userId)
      .single();

    if (fetchError || !merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found or does not belong to you'
      });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('merchants')
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
      .from('merchant_portal_users')
      .select('merchant_id')
      .eq('id', userId)
      .single();

    if (userData?.merchant_id === merchantId) {
      // Get first remaining active merchant
      const { data: remainingMerchants } = await supabase
        .from('merchants')
        .select('id')
        .eq('created_by', userId)
        .eq('is_active', true)
        .limit(1);

      const newActiveMerchant = remainingMerchants?.[0]?.id || null;

      await supabase
        .from('merchant_portal_users')
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
    const { businessName, stampsRequired, logo, color } = req.body;
    const userId = req.merchant.userId;

    console.log('📝 Updating merchant:', merchantId, 'User:', userId);
    console.log('Request body:', { businessName, stampsRequired, logo, color });

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
      .from('merchants')
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
    console.log('Created by:', existingMerchant.created_by, 'User ID:', userId);

    if (existingMerchant.created_by !== userId) {
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
      .from('merchants')
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
