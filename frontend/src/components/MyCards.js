import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import NavBar from './NavBar';
import './MyCards.css';

function MyCards() {
  const { user, updateToken } = useAuth();
  const navigate = useNavigate();
  
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // New card form state
  const [formData, setFormData] = useState({
    businessName: '',
    category: 'Food & Beverage',
    stampsRequired: 10,
    rewardDescription: '',
    color: '#667eea',
    logo: '🏪'
  });

  const categories = [
    'Food & Beverage',
    'Retail',
    'Services',
    'Health & Wellness',
    'Entertainment',
    'Other'
  ];

  const colorOptions = [
    { name: 'Purple', value: '#667eea' },
    { name: 'Blue', value: '#4299e1' },
    { name: 'Green', value: '#48bb78' },
    { name: 'Orange', value: '#ed8936' },
    { name: 'Red', value: '#f56565' },
    { name: 'Pink', value: '#ed64a6' }
  ];

  const emojiOptions = ['🏪', '☕', '🍕', '🍔', '🍰', '💇', '🏋️', '🎬', '🛍️', '🌮'];

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/merchants');
      setMerchants(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching merchants:', err);
      setError('Failed to load loyalty cards');
      setLoading(false);
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('/api/merchants/create', formData);
      
      // Reset form and close
      setFormData({
        businessName: '',
        category: 'Food & Beverage',
        stampsRequired: 10,
        rewardDescription: '',
        color: '#667eea',
        logo: '🏪'
      });
      setShowCreateForm(false);
      
      // Refresh list
      await fetchMerchants();
      
      // Show success message
      setSuccessMessage('Loyalty card created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error creating card:', err);
      setError(err.response?.data?.error || 'Failed to create loyalty card');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (merchantId) => {
    if (!window.confirm('Are you sure you want to delete this loyalty card? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(merchantId);
      await axios.delete(`/api/merchants/${merchantId}`);
      await fetchMerchants();
      
      // Refresh user data
      await axios.get('/api/auth/verify');
      
      // Show success message
      setSuccessMessage('Loyalty card deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting card:', err);
      setError(err.response?.data?.error || 'Failed to delete loyalty card');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetActive = async (merchantId) => {
    try {
      const response = await axios.post(`/api/merchants/set-active/${merchantId}`);
      
      // If we got a new token, update it properly through AuthContext
      if (response.data.data?.token) {
        await updateToken(response.data.data.token);
        
        console.log('Token updated, navigating to dashboard for merchant:', merchantId);
        
        // Navigate to dashboard (no page reload needed since token is already updated)
        navigate('/dashboard');
      } else {
        console.warn('No token in response, using fallback redirect');
        // Fallback if no token returned
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error setting active card:', err);
      alert(err.response?.data?.error || 'Failed to set active card');
    }
  };

  if (loading && merchants.length === 0) {
    return (
      <>
        <NavBar />
        <div className="page-with-navbar my-cards-container">
          <div className="my-cards-main">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your loyalty cards...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="page-with-navbar my-cards-container">

      {/* Success/Error Notifications */}
      {successMessage && (
        <div className="success-notification">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="error-notification">
          <span className="error-icon">✕</span>
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="my-cards-main">
        <div className="my-cards-content">
          {/* Header */}
          <div className="my-cards-header">
            <h1>My Loyalty Cards</h1>
            <p>Manage all your loyalty stamp card programs</p>
          </div>

          {/* Create Card Button */}
          <button 
            className="btn-create-card" 
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '✕ Cancel' : '+ Create New Card'}
          </button>

        {showCreateForm && (
          <div className="create-form">
            <h3>Create New Loyalty Card</h3>
            <form onSubmit={handleCreateCard}>
              <div className="form-grid">
            <div className="form-group">
              <label>Business Name *</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
                placeholder="e.g., Coffee Shop"
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Stamps Required *</label>
              <div className="stamps-options">
                {[5, 8, 10, 12, 15].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`stamp-btn ${formData.stampsRequired === num ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, stampsRequired: num })}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <small>Most businesses choose 10 stamps</small>
            </div>

            <div className="form-group">
              <label>Reward Description *</label>
              <input
                type="text"
                value={formData.rewardDescription}
                onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
                required
                placeholder="e.g., Free coffee"
              />
            </div>

            <div className="form-group">
              <label>Card Color</label>
              <div className="color-picker">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`color-option ${formData.color === color.value ? 'active' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Logo Emoji</label>
              <div className="emoji-picker">
                {emojiOptions.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-option ${formData.logo === emoji ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, logo: emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="cards-grid">
          {merchants.length === 0 ? (
            <div className="no-cards">
              <div className="no-cards-icon">🎴</div>
              <h3>No Loyalty Cards Yet</h3>
              <p>Create your first loyalty stamp card to get started</p>
            </div>
          ) : (
            merchants.map(merchant => (
              <div 
                key={merchant.id} 
                className={`loyalty-card ${user?.merchant?.id === merchant.id ? 'active' : ''}`}
              >
                <div className="card-header">
                  <div className="card-logo">
                    {merchant.logo && merchant.logo.startsWith('data:image') ? (
                      <img src={merchant.logo} alt={merchant.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      merchant.logo || '🏪'
                    )}
                  </div>
                  <div className="card-info">
                    <h3>{merchant.name}</h3>
                    <p className="card-category">{merchant.category}</p>
                  </div>
                </div>

                <div className="card-details">
                  <div className="card-stamps">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                    <span>{merchant.stamps_required} stamps</span>
                  </div>
                  <div className="card-reward">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 6L13.5 9L17 9.5L14.5 12L15 15.5L12 13.5L9 15.5L9.5 12L7 9.5L10.5 9L12 6Z"/>
                    </svg>
                    <span>{merchant.reward_description}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-view-dashboard"
                    onClick={() => handleSetActive(merchant.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    View Dashboard
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteCard(merchant.id)}
                    disabled={deletingId === merchant.id}
                    title="Delete card"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default MyCards;
