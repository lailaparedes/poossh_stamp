import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Setup.css';

function Setup() {
  const [formData, setFormData] = useState({
    stampsRequired: 10,
    rewardDescription: '',
    color: '#667eea',
    logo: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
        
        // Navigate to dashboard (no page reload needed)
        navigate('/dashboard');
      } else {
        setError(response.data.error || 'Failed to create loyalty program');
        setLoading(false);
      }
    } catch (err) {
      console.error('Setup error:', err);
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
            <span className="logo-icon">🎴</span>
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
              <label htmlFor="logo">Logo (Optional)</label>
              <input
                id="logo"
                name="logo"
                type="text"
                value={formData.logo}
                onChange={handleChange}
                placeholder="Emoji or image URL (e.g., ☕ or https://...)"
                disabled={loading}
              />
              <small className="hint">Use an emoji or paste an image URL</small>
            </div>

            {/* Preview Card */}
            <div className="preview-section">
              <div className="preview-card" style={{ borderColor: formData.color }}>
                <div className="preview-logo">
                  {formData.logo || '🏪'}
                </div>
                <div className="preview-info">
                  <h3>{user?.fullName || user?.name || 'Punch'}</h3>
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
