import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import './Customers.css';

function Customers() {
  const navigate = useNavigate();
  
  const [customersByMerchant, setCustomersByMerchant] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/analytics/customers');
      setCustomersByMerchant(response.data.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
      setLoading(false);
    }
  };

  const filterCustomers = (customers) => {
    if (!searchTerm) return customers;
    
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getProgressPercentage = (current, required) => {
    return Math.min((current / required) * 100, 100);
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

  return (
    <div className="customers-container">
      <Sidebar />
      
      <div className="customers-content">
        <div className="customers-header">
          <div className="customers-header-info">
            <h1>Customers</h1>
            <p>View all customers with active loyalty cards</p>
          </div>
          <div className="customers-header-actions">
            <button className="btn-dashboard" onClick={() => navigate('/dashboard')}>
              📊 Dashboard
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Customers by Merchant */}
        {customersByMerchant.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h2>No Customers Yet</h2>
            <p>Customers will appear here once they create loyalty cards for your businesses</p>
          </div>
        ) : (
          <div className="merchants-grid">
            {customersByMerchant.map((merchantData) => {
              const filteredCustomers = filterCustomers(merchantData.customers);
              
              if (filteredCustomers.length === 0 && searchTerm) {
                return null;
              }

              return (
                <div key={merchantData.merchant.id} className="merchant-section">
                  <div className="merchant-header">
                    <div className="merchant-logo">
                      {merchantData.merchant.logo || '🏪'}
                    </div>
                    <div className="merchant-info">
                      <h2>{merchantData.merchant.name}</h2>
                      <p>{merchantData.merchant.category}</p>
                    </div>
                    <div className="customer-count">
                      <span className="count">{filteredCustomers.length}</span>
                      <span className="label">Customers</span>
                    </div>
                  </div>

                  {filteredCustomers.length === 0 ? (
                    <div className="no-customers">
                      <p>No customers with active cards yet</p>
                    </div>
                  ) : (
                    <div className="customers-list">
                      {filteredCustomers.map((customer) => (
                        <div key={customer.cardId} className="customer-card">
                          <div className="customer-main">
                            <div className="customer-avatar">
                              {customer.avatar ? (
                                <img src={customer.avatar} alt={customer.name} />
                              ) : (
                                <span>{customer.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="customer-details">
                              <h3>{customer.name}</h3>
                              <p className="customer-email">{customer.email}</p>
                              {customer.phone && (
                                <p className="customer-phone">{customer.phone}</p>
                              )}
                            </div>
                          </div>

                          <div className="customer-stats">
                            <div className="stat-item">
                              <span className="stat-label">Current Stamps</span>
                              <span className="stat-value">
                                {customer.currentStamps} / {customer.stampsRequired}
                              </span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Total Rewards</span>
                              <span className="stat-value highlight">{customer.totalRewards}</span>
                            </div>
                          </div>

                          <div className="progress-section">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ 
                                  width: `${getProgressPercentage(customer.currentStamps, customer.stampsRequired)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="progress-text">
                              {Math.round(getProgressPercentage(customer.currentStamps, customer.stampsRequired))}% complete
                            </span>
                          </div>

                          <div className="customer-footer">
                            <span className="joined-date">
                              Joined: {formatDate(customer.joinedDate)}
                            </span>
                            <span className="last-activity">
                              Last activity: {formatDate(customer.lastActivity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {searchTerm && customersByMerchant.every(m => filterCustomers(m.customers).length === 0) && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h2>No Results Found</h2>
            <p>No customers match your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
