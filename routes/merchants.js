const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticateMerchant = require('../middleware/auth');

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

    // Get onboarding data
    console.log('Fetching onboarding data...');
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('merchant_onboarding_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Onboarding query result:', { data: onboardingData, error: onboardingError });

    if (onboardingError || !onboardingData) {
      console.error('Onboarding data not found:', onboardingError);
      return res.status(400).json({
        success: false,
        error: 'Onboarding data not found. Please try signing up again.'
      });
    }

    // Create merchant in merchants table
    console.log('Creating merchant with data:', {
      name: onboardingData.business_name,
      logo: logo || '🏪',
      category: onboardingData.category,
      stamps_required: stampsRequired,
      reward_description: rewardDescription,
      color: color
    });

    const { data: newMerchant, error: merchantError } = await supabase
      .from('merchants')
      .insert([{
        name: onboardingData.business_name,
        logo: logo || '🏪',
        category: onboardingData.category,
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

    // Delete onboarding data
    console.log('Cleaning up onboarding data...');
    await supabase
      .from('merchant_onboarding_data')
      .delete()
      .eq('user_id', userId);

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

module.exports = router;
