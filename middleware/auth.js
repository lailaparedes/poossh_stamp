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

    // Check if session exists and is valid
    const { data: session, error: sessionError } = await supabase
      .from('merchant_portal_sessions')
      .select('*')
      .eq('token', token)
      .eq('user_id', decoded.userId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired session' 
      });
    }

    // Attach merchant info to request
    req.merchant = {
      userId: decoded.userId,
      merchantId: decoded.merchantId,
      email: decoded.email,
      role: decoded.role
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
