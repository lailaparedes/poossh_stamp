import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Sidebar from './Sidebar';
import './MyCards.css';

function MyCards() {
  const { updateToken } = useAuth();
  const navigate = useNavigate();
  
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    stampsRequired: 10,
    rewardDescription: '',
    expiryDays: 90,
    color: '#FF6B35', // Orange default
    logo: '☕',
    category: 'Coffee'
  });

  const colorOptions = [
    { name: 'Orange', value: '#FF6B35' },
    { name: 'Green', value: '#34C759' },
    { name: 'Purple', value: '#9D4EDD' },
    { name: 'Blue', value: '#007AFF' },
    { name: 'Red', value: '#FF3B30' },
    { name: 'Violet', value: '#7B68EE' }
  ];

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/merchants');
      setMerchants(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching merchants:', err);
      setError('Failed to load loyalty cards');
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      businessName: '',
      description: '',
      stampsRequired: 10,
      rewardDescription: '',
      expiryDays: 90,
      color: '#FF6B35',
      logo: '☕',
      category: 'Coffee'
    });
    setEditingCard(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (merchant) => {
    setFormData({
      businessName: merchant.name,
      description: merchant.category || '',
      stampsRequired: merchant.stamps_required,
      rewardDescription: merchant.reward_description || '',
      expiryDays: 90,
      color: merchant.color || '#FF6B35',
      logo: merchant.logo || '☕',
      category: merchant.category || 'Coffee'
    });
    setEditingCard(merchant);
    setShowCreateModal(true);
    setMenuOpenId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCard) {
        // Update existing card
        await axios.put(`/api/merchants/${editingCard.id}`, {
          name: formData.businessName,
          category: formData.description,
          stamps_required: formData.stampsRequired,
          reward_description: formData.rewardDescription,
          color: formData.color,
          logo: formData.logo
        });
      } else {
        // Create new card
        await axios.post('/api/merchants/create', {
          businessName: formData.businessName,
          category: formData.description,
          stampsRequired: formData.stampsRequired,
          rewardDescription: formData.rewardDescription,
          color: formData.color,
          logo: formData.logo
        });
      }
      
      setShowCreateModal(false);
      await fetchMerchants();
    } catch (err) {
      console.error('Error saving card:', err);
      setError(err.response?.data?.error || 'Failed to save loyalty card');
    }
  };

  const handleDelete = async (merchantId) => {
    if (!window.confirm('Are you sure you want to delete this loyalty card?')) {
      return;
    }

    try {
      await axios.delete(`/api/merchants/${merchantId}`);
      await fetchMerchants();
      setMenuOpenId(null);
    } catch (err) {
      console.error('Error deleting card:', err);
      setError('Failed to delete card');
    }
  };

  const handleSetActive = async (merchantId) => {
    try {
      const response = await axios.post(`/api/merchants/set-active/${merchantId}`);
      if (response.data.data?.token) {
        await updateToken(response.data.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error setting active card:', err);
      alert('Failed to set active card');
    }
  };

  const renderStampSlots = (stampsRequired, color) => {
    const slots = [];
    for (let i = 0; i < Math.min(stampsRequired, 10); i++) {
      slots.push(
        <div key={i} className="stamp-slot" style={{ borderColor: color }}>
          <span>{i + 1}</span>
        </div>
      );
    }
    return slots;
  };

  if (loading && merchants.length === 0) {
    return (
      <div className="my-cards-container">
        <Sidebar />
        <div className="my-cards-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your loyalty cards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-cards-container">
      <Sidebar />
      
      <div className="my-cards-content">
        {/* Header */}
        <div className="published-cards-header">
          <div>
            <h1>Published Loyalty Cards</h1>
            <p className="subtitle">Manage your active stamp card programs</p>
          </div>
          <button className="btn-new-card" onClick={handleOpenCreate}>
            + New Card
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Cards Grid */}
        {merchants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎴</div>
            <h2>No Loyalty Cards Yet</h2>
            <p>Create your first loyalty card to start rewarding customers</p>
            <button className="btn-create-first" onClick={handleOpenCreate}>
              + Create Your First Card
            </button>
          </div>
        ) : (
          <div className="cards-grid-horizontal">
            {merchants.map((merchant) => (
              <div key={merchant.id} className="loyalty-card-horizontal" style={{ borderTopColor: merchant.color || '#FF6B35' }}>
                {/* Card Header */}
                <div className="card-horizontal-header">
                  <h3 style={{ color: merchant.color || '#FF6B35' }}>{merchant.name}</h3>
                  <div className="card-menu">
                    <button 
                      className="menu-trigger"
                      onClick={() => setMenuOpenId(menuOpenId === merchant.id ? null : merchant.id)}
                    >
                      ⋮
                    </button>
                    {menuOpenId === merchant.id && (
                      <div className="menu-dropdown">
                        <button onClick={() => handleOpenEdit(merchant)}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleSetActive(merchant.id)}>
                          👁️ View Dashboard
                        </button>
                        <button onClick={() => handleDelete(merchant.id)} className="danger">
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="card-description">
                  Buy {merchant.stamps_required} {merchant.category?.toLowerCase() || 'items'}, get 1 free
                </p>

                {/* Stamp Slots */}
                <div className="stamp-slots-container">
                  {renderStampSlots(merchant.stamps_required, merchant.color || '#FF6B35')}
                </div>

                {/* Stats */}
                <div className="card-stats-footer">
                  <div className="stat-item">
                    <span className="stat-icon">👥</span>
                    <div>
                      <span className="stat-label">Active Users</span>
                      <span className="stat-value">{merchant.active_users || 0}</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🎫</span>
                    <div>
                      <span className="stat-label">Total Stamps</span>
                      <span className="stat-value">{merchant.total_stamps || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-layout">
              {/* Left Side - Form */}
              <div className="modal-form-section">
                <h2>Card Details</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Card Name</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="e.g., Coffee Lover Card"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g., Buy 10 coffees, get 1 free"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Number of Stamps Required</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.stampsRequired}
                      onChange={(e) => setFormData({ ...formData, stampsRequired: parseInt(e.target.value) })}
                      required
                    />
                    <span className="form-hint">Maximum 20 stamps</span>
                  </div>

                  <div className="form-group">
                    <label>Reward Description</label>
                    <textarea
                      value={formData.rewardDescription}
                      onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
                      placeholder="e.g., One free coffee of any size"
                      rows="3"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Card Expiry (days)</label>
                    <select
                      value={formData.expiryDays}
                      onChange={(e) => setFormData({ ...formData, expiryDays: parseInt(e.target.value) })}
                    >
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Card Color Theme</label>
                    <div className="color-picker-grid">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`color-option ${formData.color === color.value ? 'selected' : ''}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          title={color.name}
                        >
                          {formData.color === color.value && <span className="check-icon">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="modal-actions-bottom">
                    <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-create">
                      📄 {editingCard ? 'Update Card' : 'Create Card'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side - Preview */}
              <div className="modal-preview-section">
                <h2>Card Preview</h2>
                <div className="card-preview-container">
                  <div className="preview-card" style={{ backgroundColor: formData.color }}>
                    <h3>{formData.businessName || 'Card Name'}</h3>
                    <p className="preview-description">
                      {formData.description || 'Card description will appear here'}
                    </p>
                    <div className="preview-stamp-slots">
                      {renderStampSlots(formData.stampsRequired, '#ffffff')}
                    </div>
                  </div>

                  <div className="preview-reward-box">
                    <strong>Reward:</strong>
                    <p>{formData.rewardDescription || 'Reward description will appear here'}</p>
                    <small>Expires after {formData.expiryDays} days</small>
                  </div>
                </div>

                {/* Tips Section */}
                <div className="tips-section">
                  <h3>Tips for Success</h3>
                  <ul>
                    <li>Keep card names short and memorable</li>
                    <li>Clearly state the reward customers will earn</li>
                    <li>10 stamps is the most popular configuration</li>
                    <li>Choose colors that match your brand</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyCards;
