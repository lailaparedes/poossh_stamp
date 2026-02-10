import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Setup.css';

function Setup() {
  const [formData, setFormData] = useState({
    cardName: '',
    stampsRequired: 10,
    rewardDescription: '',
    color: '#667eea',
    logo: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { user, logout, updateToken } = useAuth();
  const navigate = useNavigate();

  const colorOptions = [
    { name: 'Purple', value: '#667eea' },
    { name: 'Blue', value: '#4299E1' },
    { name: 'Green', value: '#48BB78' },
    { name: 'Orange', value: '#ED8936' },
    { name: 'Red', value: '#F56565' },
    { name: 'Pink', value: '#ED64A6' },
    { name: 'Teal', value: '#38B2AC' },
    { name: 'Brown', value: '#8B4513' }
  ];

  const emojiOptions = ['☕', '🍕', '🍔', '🍰', '💇', '🏋️', '🛒', '🎬', '🏪', '💼', '🎨', '🍜'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoFile = (file) => {
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, logo: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleLogoFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/merchants/create-loyalty-program', formData);

      if (response.data.success) {
        // Save the new token with updated merchantId
        if (response.data.data.token) {
          await updateToken(response.data.data.token);
        }
        
        setLoading(false);
        
        // Navigate to my cards page to see the created card
        navigate('/my-cards');
      } else {
        // Check if it's a plan limit error
        if (response.data.needsUpgrade) {
          alert('You have reached the Starter plan limit (2 cards). Please upgrade to Pro to create unlimited cards.');
          navigate('/profile');
          return;
        }
        
        setError(response.data.error || 'Failed to create loyalty program');
        setLoading(false);
      }
    } catch (err) {
      console.error('Setup error:', err);
      
      // Check if it's a plan limit error
      if (err.response?.data?.needsUpgrade) {
        alert('You have reached the Starter plan limit (2 cards). Please upgrade to Pro to create unlimited cards.');
        navigate('/profile');
        return;
      }
      
      setError('Failed to create loyalty program. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="setup-container">
      {/* Navigation */}
      <nav className="setup-nav">
        <div className="nav-content">
          <div className="nav-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">Poossh Stamp</span>
          </div>
          <button className="btn-nav-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="setup-main">
        <div className="setup-content">
          {/* Header */}
          <div className="setup-header">
            <h1>Welcome to Poossh Stamp!</h1>
            <p>Let's set up your loyalty rewards program.</p>
          </div>

          {/* Form Card */}
          <div className="setup-form-card">
            {/* Welcome Section */}
            <div className="welcome-section">
              <div className="welcome-icon">🎉</div>
              <h2>Let's Get Started</h2>
              <p>
                Create your digital stamp card that customers will see in the Poossh Stamp 
                app. Once you're done, customers can start collecting stamps at your 
                business!
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="setup-form">
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* Card Name */}
            <div className="form-group">
              <label htmlFor="cardName">Card Name *</label>
              <input
                id="cardName"
                name="cardName"
                type="text"
                value={formData.cardName}
                onChange={handleChange}
                placeholder={`e.g., ${user?.business_name || 'Coffee Shop'} Rewards`}
                required
                disabled={loading}
              />
              <small className="hint">This is what customers see when they scan your QR code</small>
            </div>

            {/* Stamps Required */}
            <div className="form-group">
              <label>How many stamps to earn a reward? *</label>
              <div className="stamps-selector">
                {[5, 8, 10, 12, 15].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`stamp-option ${formData.stampsRequired === num ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, stampsRequired: num })}
                    disabled={loading}
                  >
                    {num} stamps
                  </button>
                ))}
              </div>
              <small className="hint">Most businesses choose 10 stamps</small>
            </div>

            {/* Reward Description */}
            <div className="form-group">
              <label htmlFor="rewardDescription">What reward do customers get? *</label>
              <input
                id="rewardDescription"
                name="rewardDescription"
                type="text"
                value={formData.rewardDescription}
                onChange={handleChange}
                placeholder="e.g., Free coffee, 10% off, Free item"
                required
                disabled={loading}
              />
              <small className="hint">Keep it short and clear</small>
            </div>

            {/* Brand Color */}
            <div className="form-group">
              <label>Choose your brand color *</label>
              <div className="color-selector">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`color-option ${formData.color === color.value ? 'active' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                    disabled={loading}
                  >
                    {formData.color === color.value && (
                      <span className="checkmark">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo */}
            <div className="form-group">
              <label>Logo (Optional)</label>
              <small className="hint">Choose an emoji or upload your own logo image</small>
              
              {/* Custom Logo Upload with Drag & Drop */}
              <div 
                className={`logo-upload-section ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="setup-logo-upload"
                  accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleLogoFile(e.target.files[0])}
                  disabled={loading}
                />
                <div className="upload-dropzone">
                  <button
                    type="button"
                    className="btn-upload-logo"
                    onClick={() => document.getElementById('setup-logo-upload').click()}
                    disabled={loading}
                  >
                    📁 Upload Custom Logo
                  </button>
                  <p className="drag-hint">or drag and drop an image here</p>
                </div>
                
                {/* Logo Preview */}
                {formData.logo && formData.logo.startsWith('data:image') && (
                  <div className="logo-preview">
                    <img src={formData.logo} alt="Logo preview" />
                    <button
                      type="button"
                      className="btn-remove-logo"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              
              {/* Emoji Options */}
              <div className="emoji-picker" style={{ marginTop: '1rem' }}>
                {emojiOptions.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-option ${formData.logo === emoji ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, logo: emoji })}
                    disabled={loading}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="preview-section">
              <div className="preview-card" style={{ borderColor: formData.color }}>
                <div className="preview-logo">
                  {formData.logo && formData.logo.startsWith('data:image') ? (
                    <img src={formData.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    formData.logo || '🏪'
                  )}
                </div>
                <div className="preview-info">
                  <h3>{formData.cardName || user?.business_name || 'Your Card'}</h3>
                  <p>{formData.stampsRequired} stamps = {formData.rewardDescription || 'Your reward'}</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                'Create My Loyalty Program'
              )}
            </button>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setup;
