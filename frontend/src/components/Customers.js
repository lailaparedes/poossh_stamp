import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';
import './Customers.css';

function Customers() {
  const navigate = useNavigate();
  
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filterCard, setFilterCard] = useState('all');
  const [availableCards, setAvailableCards] = useState([]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/analytics/customers');
      const customersByMerchant = response.data.data;
      
      // Flatten the data structure: group customers by user, with all their cards
      const customersMap = new Map();
      const cardsSet = new Set();
      
      customersByMerchant.forEach(merchantData => {
        merchantData.customers.forEach(customer => {
          const userId = customer.userId;
          
          // Track unique card names
          cardsSet.add(merchantData.merchant.name);
          
          if (!customersMap.has(userId)) {
            customersMap.set(userId, {
              userId: customer.userId,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              avatar: customer.avatar,
              joinedDate: customer.joinedDate,
              cards: [],
              totalVisits: 0,
              totalRedemptions: 0
            });
          }
          
          const customerData = customersMap.get(userId);
          customerData.cards.push({
            cardId: customer.cardId,
            merchantId: merchantData.merchant.id,
            merchantName: merchantData.merchant.name,
            merchantLogo: merchantData.merchant.logo,
            merchantCategory: merchantData.merchant.category,
            currentStamps: customer.currentStamps,
            stampsRequired: customer.stampsRequired,
            totalRewards: customer.totalRewards,
            lastActivity: customer.lastActivity,
            color: getCardColor(merchantData.merchant.category)
          });
          
          // Aggregate stats (you may want to fetch actual visit/redemption data)
          customerData.totalRedemptions += customer.totalRewards;
        });
      });
      
      const customersArray = Array.from(customersMap.values());
      
      // Sort by most recent activity
      customersArray.sort((a, b) => {
        const aLatest = Math.max(...a.cards.map(c => new Date(c.lastActivity)));
        const bLatest = Math.max(...b.cards.map(c => new Date(c.lastActivity)));
        return bLatest - aLatest;
      });
      
      setAllCustomers(customersArray);
      setAvailableCards(['all', ...Array.from(cardsSet)]);
      
      // Select first customer by default
      if (customersArray.length > 0) {
        setSelectedCustomer(customersArray[0]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  const getCardColor = (category) => {
    const colors = {
      'Coffee': '#FF8C00',
      'Restaurant': '#32CD32',
      'Retail': '#9370DB',
      'Fitness': '#FF69B4',
      'Beauty': '#FF1493',
      'Food': '#FFD700'
    };
    return colors[category] || '#007AFF';
  };

  const filterCustomers = (customers) => {
    let filtered = customers;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
      );
    }
    
    // Filter by card
    if (filterCard !== 'all') {
      filtered = filtered.filter(customer =>
        customer.cards.some(card => card.merchantName === filterCard)
      );
    }
    
    return filtered;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getProgressPercentage = (current, required) => {
    return Math.min((current / required) * 100, 100);
  };
  
  const getTotalVisits = (customer) => {
    // Calculate based on stamps given (estimate)
    return customer.cards.reduce((sum, card) => {
      return sum + card.currentStamps + (card.totalRewards * card.stampsRequired);
    }, 0);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button className="retry-button" onClick={fetchCustomers}>
          Retry
        </button>
      </div>
    );
  }

  const filteredCustomers = filterCustomers(allCustomers);

  return (
    <>
      <NavBar />
      <div className="page-with-navbar customers-container">
        <div className="customers-content">
        {/* Header with back button and export */}
        <div className="customers-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/dashboard')}>
              ←
            </button>
            <div>
              <h1>Customers</h1>
              <p className="customer-count-text">{filteredCustomers.length} customers found</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="search-filter-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-wrapper">
            <label htmlFor="card-filter">Filter by Card</label>
            <select 
              id="card-filter"
              value={filterCard} 
              onChange={(e) => setFilterCard(e.target.value)}
              className="card-filter-select"
            >
              {availableCards.map(card => (
                <option key={card} value={card}>
                  {card === 'all' ? 'All Cards' : card}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content: List + Details Panel */}
        {allCustomers.length === 0 ? (
          <div className="empty-state">
            <h2>No Customers Yet</h2>
            <p>Customers will appear here once they create loyalty cards</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <h2>No Results Found</h2>
            <p>No customers match your search criteria</p>
          </div>
        ) : (
          <div className="customers-main">
            {/* Customer List */}
            <div className="customers-list-panel">
              {filteredCustomers.map((customer) => (
                <div 
                  key={customer.userId} 
                  className={`customer-list-item ${selectedCustomer?.userId === customer.userId ? 'selected' : ''}`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="customer-item-header">
                    <h3>{customer.name}</h3>
                    <div className="customer-stats-mini">
                      <span className="stat-badge">{getTotalVisits(customer)} visits</span>
                      <span className="stat-badge">{customer.totalRedemptions} redemptions</span>
                    </div>
                  </div>
                  
                  <p className="customer-email-mini">{customer.email}</p>
                  <p className="customer-joined">Joined {formatDate(customer.joinedDate)}</p>
                  
                  <div className="customer-cards-count">
                    <span>{customer.cards.length} active {customer.cards.length === 1 ? 'card' : 'cards'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Details Panel */}
            {selectedCustomer && (
              <div className="customer-details-panel">
                <h2>Customer Details</h2>
                
                <div className="details-section">
                  <div className="detail-item">
                    <div>
                      <label>Name</label>
                      <p>{selectedCustomer.name}</p>
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <div>
                      <label>Email</label>
                      <p>{selectedCustomer.email}</p>
                    </div>
                  </div>
                  
                  {selectedCustomer.phone && (
                    <div className="detail-item">
                      <div>
                        <label>Phone</label>
                        <p>{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <div>
                      <label>Member Since</label>
                      <p>{formatDate(selectedCustomer.joinedDate)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="stats-section">
                  <div className="stat-box">
                    <span className="stat-number">{getTotalVisits(selectedCustomer)}</span>
                    <span className="stat-label">Total Visits</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-number">{selectedCustomer.totalRedemptions}</span>
                    <span className="stat-label">Redemptions</span>
                  </div>
                </div>
                
                <div className="active-cards-section">
                  <h3>Active Cards ({selectedCustomer.cards.length})</h3>
                  
                  {selectedCustomer.cards.map((card) => (
                    <div key={card.cardId} className="active-card-detail">
                      <div className="card-detail-header">
                        <span className="card-detail-name">{card.merchantName}</span>
                        <span className="card-detail-stamps">{card.currentStamps} / {card.stampsRequired} stamps</span>
                      </div>
                      <div className="card-detail-progress">
                        <div 
                          className="progress-bar-detail"
                          style={{ 
                            width: `${getProgressPercentage(card.currentStamps, card.stampsRequired)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
}

export default Customers;
