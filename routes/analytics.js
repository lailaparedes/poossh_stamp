const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticateMerchant = require('../middleware/auth');

// Simple in-memory cache for analytics (30 minutes TTL)
const analyticsCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

function getCacheKey(merchantId, endpoint) {
  return `${merchantId}:${endpoint}`;
}

function getFromCache(cacheKey) {
  const cached = analyticsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache HIT] ${cacheKey}`);
    return cached.data;
  }
  console.log(`[Cache MISS] ${cacheKey}`);
  return null;
}

function setCache(cacheKey, data) {
  analyticsCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

// Helper function to convert UTC date to local date string (YYYY-MM-DD)
function toLocalDateString(dateString) {
  const date = new Date(dateString);
  // Use local timezone, format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get merchant dashboard analytics (Protected Route)
router.get('/dashboard', authenticateMerchant, async (req, res) => {
  try {
    const { merchantId } = req.merchant;
    const cacheKey = getCacheKey(merchantId, 'dashboard');
    
    if (!merchantId) {
      console.error('No merchantId found in request');
      return res.status(400).json({ 
        success: false, 
        error: 'Merchant ID not found. Please complete setup first.' 
      });
    }

    // Check cache first
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, cached: true });
    }

    console.log('[Analytics] Dashboard - Merchant:', merchantId);

    // 1. Active Cards Count
    const { count: activeCards, error: activeCardsError } = await supabase
      .from('stamp_cards')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId);

    if (activeCardsError) throw activeCardsError;

    // 2. Total Rewards Given Out (includes all historical rewards)
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

    const dashboardData = {
      activeCards: activeCards || 0,
      totalRewards: totalRewards || 0,
      redeemedRewards: redeemedRewards || 0,
      pendingRewards: (totalRewards || 0) - (redeemedRewards || 0)
    };

    console.log('[Analytics] Dashboard stats:', dashboardData);

    // Cache the result for 30 minutes
    setCache(cacheKey, dashboardData);

    res.json({
      success: true,
      data: dashboardData,
      cached: false
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
    const cacheKey = getCacheKey(merchantId, 'new-cards-daily');

    // Check cache first
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, cached: true });
    }

    // Fetch active cards
    const { data: activeCards, error: activeError } = await supabase
      .from('stamp_cards')
      .select('created_at')
      .eq('merchant_id', merchantId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at');

    if (activeError) throw activeError;

    // Fetch deleted cards (for historical accuracy)
    const { data: deletedCards, error: deletedError } = await supabase
      .from('deleted_stamp_cards')
      .select('created_at')
      .eq('merchant_id', merchantId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    // Combine active and deleted cards for accurate historical count
    const allCards = [
      ...(activeCards || []),
      ...(deletedCards || [])
    ];
    
    console.log(`[Analytics] New cards data - Merchant: ${merchantId}, Active: ${activeCards?.length || 0}, Deleted: ${deletedCards?.length || 0}, Total: ${allCards.length}`);

    // Create all dates in the range (using local timezone)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    const cardsByDate = {};
    
    // Initialize all dates with 0
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = toLocalDateString(currentDate.toISOString());
      cardsByDate[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in actual data using local timezone
    if (allCards.length > 0) {
      allCards.forEach(card => {
        const dateStr = toLocalDateString(card.created_at);
        cardsByDate[dateStr] = (cardsByDate[dateStr] || 0) + 1;
      });
    }

    // Convert to array format for charts, sorted by date
    const chartData = Object.entries(cardsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        count
      }));

    // Cache the result for 30 minutes
    setCache(cacheKey, chartData);

    res.json({ success: true, data: chartData, cached: false });
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
    const cacheKey = getCacheKey(merchantId, 'stamp-activity');

    // Check cache first
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, cached: true });
    }

    const { data, error } = await supabase
      .from('stamp_history')
      .select('created_at, amount')
      .eq('merchant_id', merchantId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at');

    if (error) throw error;
    
    const totalStamps = data?.reduce((sum, s) => sum + s.amount, 0) || 0;
    console.log(`[Analytics] Stamp activity - Merchant: ${merchantId}, Transactions: ${data?.length || 0}, Total stamps: ${totalStamps}`);

    // Create all dates in the range (using local timezone)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    const stampsByDate = {};
    
    // Initialize all dates with 0
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = toLocalDateString(currentDate.toISOString());
      stampsByDate[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in actual data using local timezone
    if (data && data.length > 0) {
      data.forEach(stamp => {
        const dateStr = toLocalDateString(stamp.created_at);
        stampsByDate[dateStr] = (stampsByDate[dateStr] || 0) + stamp.amount;
      });
    }

    // Convert to array format for charts, sorted by date
    const chartData = Object.entries(stampsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stamps]) => ({
        date,
        stamps
      }));

    // Cache the result for 30 minutes
    setCache(cacheKey, chartData);

    res.json({ success: true, data: chartData, cached: false });
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

// Get all customers with their loyalty cards for the logged-in user's merchants (Protected Route)
router.get('/customers', authenticateMerchant, async (req, res) => {
  try {
    const { merchantId, userId } = req.merchant;

    // Get all merchants created by this user
    const { data: userMerchants, error: merchantsError } = await supabase
      .from('merchants')
      .select('id, name, logo, category')
      .eq('created_by', userId);

    if (merchantsError) throw merchantsError;

    // Get all stamp cards for these merchants with user details
    const { data: stampCards, error: cardsError } = await supabase
      .from('stamp_cards')
      .select(`
        id,
        user_id,
        merchant_id,
        current_stamps,
        total_rewards,
        created_at,
        users (
          id,
          name,
          email,
          phone_number
        ),
        merchants (
          id,
          name,
          logo,
          category,
          stamps_required
        )
      `)
      .in('merchant_id', userMerchants.map(m => m.id))
      .order('created_at', { ascending: false });

    if (cardsError) throw cardsError;

    // Group customers by merchant
    const customersByMerchant = {};
    
    userMerchants.forEach(merchant => {
      customersByMerchant[merchant.id] = {
        merchant: merchant,
        customers: []
      };
    });

    stampCards.forEach(card => {
      if (customersByMerchant[card.merchant_id]) {
        customersByMerchant[card.merchant_id].customers.push({
          cardId: card.id,
          userId: card.user_id,
          name: card.users?.name || 'Unknown',
          email: card.users?.email || '',
          phone: card.users?.phone_number || '',
          avatar: null,
          currentStamps: card.current_stamps,
          totalRewards: card.total_rewards,
          joinedDate: card.created_at,
          lastActivity: card.created_at,
          stampsRequired: card.merchants?.stamps_required || 10
        });
      }
    });

    res.json({ 
      success: true, 
      data: Object.values(customersByMerchant)
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || error.toString() || 'Failed to fetch customers' 
    });
  }
});

// Clear cache for merchant (useful for manual refresh)
router.post('/clear-cache', authenticateMerchant, async (req, res) => {
  try {
    const { merchantId } = req.merchant;
    
    // Clear all cache entries for this merchant
    const endpoints = ['dashboard', 'new-cards-daily', 'stamp-activity'];
    let clearedCount = 0;
    
    endpoints.forEach(endpoint => {
      const cacheKey = getCacheKey(merchantId, endpoint);
      if (analyticsCache.has(cacheKey)) {
        analyticsCache.delete(cacheKey);
        clearedCount++;
      }
    });
    
    console.log(`[Cache] Cleared ${clearedCount} cache entries for merchant: ${merchantId}`);
    
    res.json({ 
      success: true, 
      message: `Cache cleared for ${clearedCount} endpoints`,
      clearedCount
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to clear cache' 
    });
  }
});

// Debug endpoint to check date range generation
router.get('/debug-dates', authenticateMerchant, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(toLocalDateString(currentDate.toISOString()));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({
      success: true,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalDays: dates.length,
      firstThree: dates.slice(0, 3),
      lastThree: dates.slice(-3),
      includesFeb5: dates.includes('2026-02-05'),
      allDates: dates
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
