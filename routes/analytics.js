const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticateMerchant = require('../middleware/auth');

// Get merchant dashboard analytics (Protected Route)
router.get('/dashboard', authenticateMerchant, async (req, res) => {
  try {
    console.log('Dashboard request from:', req.merchant);
    const { merchantId } = req.merchant; // Get from authenticated merchant
    
    if (!merchantId) {
      console.error('No merchantId found in request');
      return res.status(400).json({ 
        success: false, 
        error: 'Merchant ID not found. Please complete setup first.' 
      });
    }

    console.log('Fetching dashboard data for merchant:', merchantId);

    // 1. Active Cards Count
    const { count: activeCards, error: activeCardsError } = await supabase
      .from('stamp_cards')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId);

    if (activeCardsError) throw activeCardsError;

    // 2. Total Rewards Given Out
    const { count: totalRewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId);

    if (rewardsError) throw rewardsError;

    // 3. Redeemed Rewards Count
    const { count: redeemedRewards, error: redeemedError } = await supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('is_redeemed', true);

    if (redeemedError) throw redeemedError;

    res.json({
      success: true,
      data: {
        activeCards: activeCards || 0,
        totalRewards: totalRewards || 0,
        redeemedRewards: redeemedRewards || 0,
        pendingRewards: (totalRewards || 0) - (redeemedRewards || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || error.toString() || 'Failed to fetch dashboard data' 
    });
  }
});

// Get new cards created per day (last 30 days) (Protected Route)
router.get('/new-cards-daily', authenticateMerchant, async (req, res) => {
  try {
    const { merchantId } = req.merchant;
    const { days = 30 } = req.query;

    const { data, error } = await supabase
      .from('stamp_cards')
      .select('created_at')
      .eq('merchant_id', merchantId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at');

    if (error) throw error;

    // Group by date
    const cardsByDate = {};
    if (data && data.length > 0) {
      data.forEach(card => {
        const date = new Date(card.created_at).toISOString().split('T')[0];
        cardsByDate[date] = (cardsByDate[date] || 0) + 1;
      });
    }

    // Convert to array format for charts
    const chartData = Object.entries(cardsByDate).map(([date, count]) => ({
      date,
      count
    }));

    res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('Error fetching new cards data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || error.toString() || 'Failed to fetch new cards data' 
    });
  }
});

// Get daily stamp activity (last 30 days) (Protected Route)
router.get('/stamp-activity', authenticateMerchant, async (req, res) => {
  try {
    const { merchantId } = req.merchant;
    const { days = 30 } = req.query;

    const { data, error } = await supabase
      .from('stamp_history')
      .select('created_at, amount')
      .eq('merchant_id', merchantId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at');

    if (error) throw error;

    // Group by date and sum stamps
    const stampsByDate = {};
    if (data && data.length > 0) {
      data.forEach(stamp => {
        const date = new Date(stamp.created_at).toISOString().split('T')[0];
        stampsByDate[date] = (stampsByDate[date] || 0) + stamp.amount;
      });
    }

    // Convert to array format for charts
    const chartData = Object.entries(stampsByDate).map(([date, stamps]) => ({
      date,
      stamps
    }));

    res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('Error fetching stamp activity:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || error.toString() || 'Failed to fetch stamp activity' 
    });
  }
});

// Get top customers for merchant (Protected Route)
router.get('/top-customers', authenticateMerchant, async (req, res) => {
  try {
    const { merchantId } = req.merchant;
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('stamp_cards')
      .select(`
        user_id,
        current_stamps,
        total_rewards,
        users (
          name,
          email,
          phone_number
        )
      `)
      .eq('merchant_id', merchantId)
      .order('total_rewards', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || error.toString() || 'Failed to fetch top customers' 
    });
  }
});

module.exports = router;
