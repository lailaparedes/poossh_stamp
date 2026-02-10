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
    const { userId } = req.merchant;
    
    // Get merchantId from query params or use user's active merchant_id
    let merchantId = req.query.merchantId;
    
    if (!merchantId) {
      // Get user's active merchant_id
      const { data: userData, error: userError } = await supabase
        .from('portal_merchant_users')
        .select('merchant_id')
        .eq('id', userId)
        .limit(1);
      
      if (userError || !userData || userData.length === 0) {
        console.error('User not found:', userError);
        return res.status(400).json({ 
          success: false, 
          error: 'User not found.' 
        });
      }
      
      merchantId = userData[0].merchant_id;
      
      if (!merchantId) {
        // No active merchant - get their first card
        const { data: cards, error: cardsError } = await supabase
          .from('merchant_cards')
          .select('id')
          .eq('created_by_user_id', userId)
          .eq('is_active', true)
          .limit(1);
        
        if (cardsError || !cards || cards.length === 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'No active cards found. Please create a loyalty program first.' 
          });
        }
        
        merchantId = cards[0].id;
      }
    }

    const cacheKey = getCacheKey(merchantId, 'dashboard');
    const forceRefresh = req.query.refresh === 'true';
    
    console.log('[Analytics] Dashboard Request');
    console.log('  - User ID:', userId);
    console.log('  - Merchant ID:', merchantId);
    console.log('  - Cache Key:', cacheKey);
    console.log('  - Force Refresh:', forceRefresh);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        console.log('[Analytics] Returning cached data');
        return res.json({ success: true, data: cachedData, cached: true });
      }
    }

    console.log('[Analytics] Cache miss - fetching fresh data');

    // Get analytics from merchant_card_analytics table
    console.log('[Analytics] Querying merchant_card_analytics for merchantId:', merchantId);
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('merchant_card_analytics')
      .select('*')
      .eq('merchant_card_id', merchantId)
      .limit(1);

    console.log('[Analytics] Analytics query result:', { 
      found: analyticsData?.length || 0, 
      data: analyticsData,
      error: analyticsError ? analyticsError.message : 'none' 
    });

    // If no analytics found, check if the card exists and create analytics entry
    if (!analyticsData || analyticsData.length === 0) {
      console.log('[Analytics] No analytics found, checking if merchant card exists...');
      const { data: cardCheck } = await supabase
        .from('merchant_cards')
        .select('id, name')
        .eq('id', merchantId)
        .limit(1);
      
      console.log('[Analytics] Merchant card check:', cardCheck);
      
      if (cardCheck && cardCheck.length > 0) {
        console.log('[Analytics] Card exists but no analytics - will use fallback data');
      }
    }

    if (analyticsError) {
      console.error('[Analytics] Fetch error:', analyticsError);
      throw analyticsError;
    }

    const analytics = analyticsData && analyticsData.length > 0 ? analyticsData[0] : null;

    if (!analytics) {
      console.log('[Analytics] ❌ No analytics found for merchant:', merchantId);
      console.log('[Analytics] This might mean the analytics table is missing this card');
      
      // Get merchant card name even if no analytics exist
      const { data: merchantCard } = await supabase
        .from('merchant_cards')
        .select('card_name, name')
        .eq('id', merchantId)
        .limit(1);
      
      const merchant = merchantCard && merchantCard.length > 0 ? merchantCard[0] : null;
      const cardName = merchant?.card_name || merchant?.name || 'Unknown Card';
      
      // Return empty/default data if no analytics exist yet
      return res.json({
        success: true,
        data: {
          activeCards: 0,
          totalStamps: 0,
          unredeemedRewards: 0,
          redeemedRewards: 0,
          merchantName: cardName,
          customersChart: [],
          stampsChart: []
        }
      });
    }

    console.log('[Analytics] ✅ Found analytics:', {
      name: analytics.merchant_name,
      activeCards: analytics.active_cards_count,
      stamps: analytics.total_stamps_collected,
      unredeemed: analytics.unredeemed_rewards_count,
      redeemed: analytics.total_rewards_redeemed,
      rawData: analytics
    });

    // 5. New customers per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: newCustomersData, error: customersChartError } = await supabase
      .from('stamp_cards')
      .select('created_at')
      .eq('merchant_id', merchantId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (customersChartError) throw customersChartError;

    // Group by day
    const customersByDay = {};
    newCustomersData?.forEach(card => {
      const day = toLocalDateString(card.created_at);
      customersByDay[day] = (customersByDay[day] || 0) + 1;
    });

    // Fill in missing days with 0
    const customersChartData = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = toLocalDateString(date.toISOString());
      customersChartData.push({
        date: dateStr,
        count: customersByDay[dateStr] || 0
      });
    }

    // 6. Stamps acquired per day (last 30 days)
    const { data: stampsPerDayData, error: stampsChartError } = await supabase
      .from('stamp_history')
      .select('created_at, amount')
      .eq('merchant_id', merchantId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (stampsChartError) throw stampsChartError;

    // Group by day
    const stampsByDay = {};
    stampsPerDayData?.forEach(stamp => {
      const day = toLocalDateString(stamp.created_at);
      stampsByDay[day] = (stampsByDay[day] || 0) + (stamp.amount || 0);
    });

    // Fill in missing days with 0
    const stampsChartData = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = toLocalDateString(date.toISOString());
      stampsChartData.push({
        date: dateStr,
        count: stampsByDay[dateStr] || 0
      });
    }

    // Get the merchant card details
    const { data: merchantCard, error: merchantError } = await supabase
      .from('merchant_cards')
      .select('id, name, card_name, logo, category, color, stamps_required')
      .eq('id', merchantId)
      .limit(1);

    const merchant = merchantCard && merchantCard.length > 0 ? merchantCard[0] : null;

    const dashboardData = {
      activeCards: analytics.active_cards_count || 0,
      totalStamps: analytics.total_stamps_collected || 0,
      totalRewards: analytics.total_rewards_earned || 0,
      redeemedRewards: analytics.total_rewards_redeemed || 0,
      pendingRewards: analytics.unredeemed_rewards_count || 0,
      redemptionRate: analytics.total_rewards_earned > 0 
        ? Math.round((analytics.total_rewards_redeemed / analytics.total_rewards_earned) * 100) 
        : 0,
      merchantName: merchant?.card_name || merchant?.name || analytics.merchant_name, // Use card_name (customer-facing)
      lastCalculated: analytics.last_calculated_at,
      merchantCardData: merchant,
      customersChart: customersChartData,
      stampsChart: stampsChartData
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
    // Set endDate to end of today to include all of today's data
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
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
    // Set endDate to end of today to include all of today's data
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
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
      .from('merchant_cards')
      .select('id, name, logo, category')
      .eq('created_by_user_id', userId);

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
        merchant_cards (
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
          stampsRequired: card.merchant_cards?.stamps_required || 10
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

module.exports = router;
