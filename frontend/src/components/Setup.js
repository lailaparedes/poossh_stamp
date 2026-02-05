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
      <div className="setup-card">
        <div className="setup-header">
          <h1>Welcome to Poossh Stamp!</h1>
          <p>Let's set up your loyalty rewards program</p>
          <button className="logout-link" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="setup-content">
          <div className="welcome-section">
            <div className="welcome-icon">🎉</div>
            <h2>Let's Get Started</h2>
            <p>
              Create your digital stamp card that customers will see in the Poossh Stamp app.
              Once you're done, customers can start collecting stamps at your business!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="setup-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="stampsRequired">
                How many stamps to earn a reward? *
              </label>
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
              <small>Most businesses choose 10 stamps</small>
            </div>

            <div className="form-group">
              <label htmlFor="rewardDescription">
                What reward do customers get? *
              </label>
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
              <small>Keep it short and clear</small>
            </div>

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
                    {formData.color === color.value && '✓'}
                  </button>
                ))}
              </div>
            </div>

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
              <small>Use an emoji or paste an image URL</small>
            </div>

            <div className="preview-card" style={{ borderLeftColor: formData.color }}>
              <div className="preview-header">
                <div className="preview-logo">
                  {formData.logo || '🏪'}
                </div>
                <div>
                  <h3>{user?.fullName || 'Your Business'}</h3>
                  <p>{formData.stampsRequired} stamps = {formData.rewardDescription || 'Your reward'}</p>
                </div>
              </div>
            </div>

            <button type="submit" className="setup-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create My Loyalty Program'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Setup;
