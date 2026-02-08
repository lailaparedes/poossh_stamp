const express = require('express');
const router = express.Router();
const supabase = require('../backend/config/supabase');

// Test database connection
router.get('/check', async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Check portal_merchant_users table
    const { data: users, error: usersError } = await supabase
      .from('portal_merchant_users')
      .select('id, email, name, business_name, created_at')
      .limit(10);
    
    if (usersError) {
      console.error('Users table error:', usersError);
      return res.json({
        success: false,
        error: usersError.message,
        table: 'portal_merchant_users',
        hint: 'Table may not exist or you may not have permissions'
      });
    }
    
    // Check for demo account specifically
    const { data: demoUsers, error: demoError } = await supabase
      .from('portal_merchant_users')
      .select('*')
      .eq('email', 'demo@poosshstamp.com')
      .limit(1);
    
    const demoUser = demoUsers && demoUsers.length > 0 ? demoUsers[0] : null;
    
    // Check merchant_cards table
    const { data: cards, error: cardsError } = await supabase
      .from('merchant_cards')
      .select('id, name, created_by_user_id')
      .limit(10);
    
    res.json({
      success: true,
      connection: '✅ Database connected',
      tables: {
        portal_merchant_users: {
          exists: !usersError,
          count: users ? users.length : 0,
          sample: users ? users.slice(0, 3) : []
        },
        merchant_cards: {
          exists: !cardsError,
          count: cards ? cards.length : 0,
          sample: cards ? cards.slice(0, 3) : []
        }
      },
      demoAccount: {
        exists: !!demoUser,
        email: demoUser ? demoUser.email : 'NOT FOUND',
        name: demoUser ? demoUser.name : 'N/A',
        business_name: demoUser ? demoUser.business_name : 'N/A',
        has_password: demoUser ? (demoUser.password_hash ? 'YES' : 'NO') : 'N/A',
        password_hash_preview: demoUser ? demoUser.password_hash.substring(0, 20) + '...' : 'N/A'
      },
      message: demoUser 
        ? '✅ Demo account found! Check if password hash is correct.'
        : '❌ Demo account NOT found! Run the SQL to create it.'
    });
  } catch (error) {
    console.error('Database check error:', error);
    res.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
