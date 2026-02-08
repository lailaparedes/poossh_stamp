const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token and authenticate merchant
async function authenticateMerchant(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    console.log('🔐 Auth header received:', authHeader ? 'YES' : 'NO');
    console.log('🔐 Token extracted:', token ? 'YES' : 'NO');
    console.log('🔐 Token length:', token?.length);
    console.log('🔐 Token preview:', token?.substring(0, 30) + '...');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Verify JWT
    console.log('🔐 Attempting JWT verification...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT verified successfully');
    console.log('🔐 Decoded userId:', decoded.userId);

    // Verify user still exists in database
    const { data: users, error: userError } = await supabase
      .from('portal_merchant_users')
      .select('id, email')
      .eq('id', decoded.userId)
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log('❌ User not found in database');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired session' 
      });
    }

    console.log('✅ User verified in database');

    // Attach merchant info to request
    req.merchant = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid authentication token' 
    });
  }
}

module.exports = authenticateMerchant;
