import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './MyCards.css';

function MyCards() {
  const { user, logout, updateToken } = useAuth();
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading && merchants.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your loyalty cards...</p>
      </div>
    );
  }

  return (
    <div className="my-cards">
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

      <div className="cards-header">
        <div>
          <h1>My Loyalty Cards</h1>
          <p>Manage all your loyalty stamp card programs</p>
        </div>
        <div className="header-buttons">
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="cards-actions">
        <button 
          className="btn-create" 
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕ Cancel' : '+ Create New Card'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-card-form">
          <h2>Create New Loyalty Card</h2>
          <form onSubmit={handleCreateCard}>
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
              <input
                type="number"
                min="1"
                max="20"
                value={formData.stampsRequired}
                onChange={(e) => setFormData({ ...formData, stampsRequired: parseInt(e.target.value) })}
                required
              />
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
          <div className="empty-state">
            <p>You haven't created any loyalty cards yet.</p>
            <button className="btn-create" onClick={() => setShowCreateForm(true)}>
              Create Your First Card
            </button>
          </div>
        ) : (
          merchants.map(merchant => (
            <div 
              key={merchant.id} 
              className={`card-item ${user?.merchant?.id === merchant.id ? 'active' : ''}`}
              style={{ borderLeftColor: merchant.color }}
            >
              <div className="card-logo" style={{ backgroundColor: merchant.color }}>
                {merchant.logo && !merchant.logo.includes('http') ? merchant.logo : '🏪'}
              </div>
              <div className="card-content">
                <h3>{merchant.name}</h3>
                <p className="card-category">{merchant.category}</p>
                <p className="card-details">
                  {merchant.stamps_required} stamps → {merchant.reward_description}
                </p>
                {user?.merchant?.id === merchant.id && (
                  <span className="active-badge">Active</span>
                )}
              </div>
              <div className="card-actions">
                {user?.merchant?.id !== merchant.id && (
                  <button
                    className="btn-small btn-primary"
                    onClick={() => handleSetActive(merchant.id)}
                  >
                    Set Active
                  </button>
                )}
                <button
                  className="btn-small btn-view"
                  onClick={() => handleSetActive(merchant.id)}
                >
                  View Dashboard
                </button>
                <button
                  className="btn-small btn-danger"
                  onClick={() => handleDeleteCard(merchant.id)}
                  disabled={deletingId === merchant.id}
                >
                  {deletingId === merchant.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyCards;
