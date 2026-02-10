const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const authenticateMerchant = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d'; // 7 days

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { businessName, ownerName, email, password, phoneNumber, category } = req.body;

    // Validate required fields
    if (!businessName || !ownerName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Business name, owner name, email, and password are required'
      });
    }

    // Check if email already exists
    const { data: existingUsers } = await supabase
      .from('portal_merchant_users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create merchant portal user (schema v2.0)
    const { data: newUsers, error: userError } = await supabase
      .from('portal_merchant_users')
      .insert([{
        email,
        password_hash: passwordHash,
        name: ownerName,
        business_name: businessName
      }])
      .select();
    
    const newUser = newUsers && newUsers.length > 0 ? newUsers[0] : null;

    if (userError || !newUser) {
      console.error('User creation error:', userError);
      return res.status(500).json({
        success: false,
        error: userError?.message || 'Failed to create account. Please try again.'
      });
    }

    console.log('✅ User created successfully:', newUser.id);

    res.json({
      success: true,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Signup failed. Please try again.'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Find user by email (schema v2.0)
    const { data: users, error: userError } = await supabase
      .from('portal_merchant_users')
      .select('*')
      .eq('email', email)
      .limit(1);

    console.log('User found:', users && users.length > 0 ? 'YES' : 'NO');
    console.log('User error:', userError?.message || 'NONE');
    
    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user) {
      console.log('❌ User not found or error');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Get the active merchant card for this user (using merchant_id from user table)
    let merchantCard = null;
    if (user.merchant_id) {
      const { data: merchantCards } = await supabase
        .from('merchant_cards')
        .select('id, name, card_name, logo, category, color, qr_code, stamps_required')
        .eq('id', user.merchant_id)
        .eq('is_active', true)
        .limit(1);
      
      merchantCard = merchantCards && merchantCards.length > 0 ? merchantCards[0] : null;
      console.log('🎯 [Login] Loaded active merchant:', merchantCard?.name, 'ID:', merchantCard?.id);
    }
    
    user.merchant = merchantCard;
    console.log('Merchant loaded:', user.merchant?.name || 'NO MERCHANT');

    // Verify password
    console.log('Checking password...');
    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', validPassword);
    
    if (!validPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token (schema v2.0)
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Note: merchant_portal_sessions table removed in schema v2.0
    // Sessions managed via JWT tokens only

    // Return user info and token
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
          businessName: user.business_name || user.name,
          createdAt: user.created_at,
          merchant: user.merchant,
          subscriptionStatus: user.subscription_status,
          subscriptionPlan: user.subscription_plan,
          stripeCustomerId: user.stripe_customer_id
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed. Please try again.' 
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // Verify JWT (schema v2.0 - no session table)
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user info
    const { data: users, error: userError } = await supabase
      .from('portal_merchant_users')
      .select('*')
      .eq('id', decoded.userId)
      .limit(1);
    
    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Get the active merchant card for this user (using merchant_id from user table)
    let merchantCard = null;
    if (user.merchant_id) {
      const { data: merchantCards } = await supabase
        .from('merchant_cards')
        .select('id, name, card_name, logo, category, color, qr_code, stamps_required')
        .eq('id', user.merchant_id)
        .eq('is_active', true)
        .limit(1);
      
      merchantCard = merchantCards && merchantCards.length > 0 ? merchantCards[0] : null;
      console.log('🎯 [Verify] Loaded active merchant:', merchantCard?.name, 'ID:', merchantCard?.id);
    }
    
    user.merchant = merchantCard;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
          businessName: user.business_name || user.name,
          createdAt: user.created_at,
          merchant: user.merchant,
          subscriptionStatus: user.subscription_status,
          subscriptionPlan: user.subscription_plan,
          stripeCustomerId: user.stripe_customer_id
        }
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // Delete session from database
      await supabase
        .from('merchant_portal_sessions')
        .delete()
        .eq('token', token);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed' 
    });
  }
});

// Update profile endpoint
router.put('/profile', authenticateMerchant, async (req, res) => {
  try {
    const { businessName, currentPassword, newPassword } = req.body;
    const userId = req.merchant.userId;

    console.log('📝 Profile Update Request - User:', userId);
    console.log('Business Name:', businessName);

    // Validate required fields
    if (!businessName) {
      return res.status(400).json({
        success: false,
        error: 'Business name is required'
      });
    }

    // Get current user data
    const { data: users, error: userError } = await supabase
      .from('portal_merchant_users')
      .select('*')
      .eq('id', userId)
      .limit(1);
    
    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user) {
      console.error('User fetch error:', userError);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If password change requested, verify current password
    if (currentPassword && newPassword) {
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!passwordMatch) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Validate new password
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 8 characters'
        });
      }

      // Hash new password and update
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      const { error: passwordError } = await supabase
        .from('portal_merchant_users')
        .update({ password_hash: newPasswordHash })
        .eq('id', userId);

      if (passwordError) {
        console.error('Password update error:', passwordError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update password'
        });
      }
    }

    // Update business name in merchant_portal_users table
    console.log('Updating business_name to:', businessName);
    const { error: updateError } = await supabase
      .from('portal_merchant_users')
      .update({ business_name: businessName })
      .eq('id', userId);

    if (updateError) {
      console.error('Business name update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update business name: ' + updateError.message
      });
    }

    // Get updated user data with merchant info
    const { data: updatedUsers, error: fetchError } = await supabase
      .from('portal_merchant_users')
      .select('*')
      .eq('id', userId)
      .limit(1);
    
    const updatedUser = updatedUsers && updatedUsers.length > 0 ? updatedUsers[0] : null;

    if (fetchError || !updatedUser) {
      console.error('Fetch updated user error:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch updated profile'
      });
    }

    // Get the active merchant card for this user (using merchant_id from user table)
    let merchantCard = null;
    if (updatedUser.merchant_id) {
      const { data: merchantCards } = await supabase
        .from('merchant_cards')
        .select('id, name, card_name, logo, category, color, qr_code, stamps_required')
        .eq('id', updatedUser.merchant_id)
        .eq('is_active', true)
        .limit(1);
      
      merchantCard = merchantCards && merchantCards.length > 0 ? merchantCards[0] : null;
      console.log('🎯 [Profile] Loaded active merchant:', merchantCard?.name, 'ID:', merchantCard?.id);
    }
    
    updatedUser.merchant = merchantCard;

    // Generate new token with updated info
    const tokenPayload = {
      userId: updatedUser.id,
      email: updatedUser.email,
      merchantId: updatedUser.created_by_user_id,
      role: updatedUser
    };

    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Update session with new token
    await supabase
      .from('merchant_portal_sessions')
      .update({ token: newToken })
      .eq('user_id', userId);

    console.log('✅ Profile updated successfully');
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.name,
          businessName: updatedUser.business_name || updatedUser.name,
          role: updatedUser,
          createdAt: updatedUser.created_at,
          merchant: updatedUser.merchant
        },
        token: newToken
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile update failed: ' + error.message
    });
  }
});

module.exports = router;
