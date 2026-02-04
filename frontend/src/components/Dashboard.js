import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from './Sidebar';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [newCardsData, setNewCardsData] = useState([]);
  const [stampActivityData, setStampActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error' | 'warning', message: string }

  const fetchAllData = useCallback(async () => {
    // Don't fetch if user has no merchant
    if (!user || !user.merchant) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard analytics
      const dashboardRes = await axios.get('/api/analytics/dashboard');
      setDashboardData(dashboardRes.data.data);

      // Fetch new cards data
      const newCardsRes = await axios.get('/api/analytics/new-cards-daily');
      setNewCardsData(newCardsRes.data.data);

      // Fetch stamp activity
      const stampActivityRes = await axios.get('/api/analytics/stamp-activity');
      setStampActivityData(stampActivityRes.data.data);

      // Get QR code from user.merchant if available
      if (user?.merchant?.qr_code) {
        setQrCode(user.merchant.qr_code);
      }

      setLoading(false);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      
      // More specific error messages
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
      
      setLoading(false);
    }
  }, [user, logout, navigate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showNotification = (type, message, duration = 5000) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), duration);
  };

  const handleGenerateQR = async () => {
    if (!user?.merchant?.id) {
      showNotification('error', 'No merchant ID found. Please try refreshing the page.');
      return;
    }
    
    try {
      setGeneratingQr(true);
      const response = await axios.post(`/api/merchants/generate-qr/${user.merchant.id}`);
      
      // Update QR code
      setQrCode(response.data.data.qr_code);
      
      // Show success notification with warning about old codes
      showNotification(
        'warning',
        '⚠️ QR Code regenerated! All previous QR codes are now invalid. Please update any printed materials.',
        7000
      );
    } catch (err) {
      console.error('Error generating QR code:', err);
      const errorMessage = err.response?.data?.error || 'Failed to generate QR code. Please try again.';
      showNotification('error', errorMessage);
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCode) {
      showNotification('error', 'No QR code available to download');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `${user?.merchant?.name || 'merchant'}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('success', '✓ QR code downloaded successfully!', 3000);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      showNotification('error', 'Failed to download QR code');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button className="retry-button" onClick={fetchAllData}>
          Retry
        </button>
      </div>
    );
  }

  // Show empty state if no merchant yet
  if (!user?.merchant) {
    return (
      <>
        <Sidebar />
        <div className="dashboard-content">
          <div className="empty-state">
            <div className="empty-state-icon">🚀</div>
            <h2>Let's Get Started!</h2>
            <p>Create your loyalty stamp card to start engaging with customers</p>
            <button 
              className="primary-button" 
              onClick={() => navigate('/setup')}
            >
              Create My Loyalty Card
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      
      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
              {notification.type === 'warning' && '⚠️'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
          <button 
            className="notification-close" 
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="header-merchant">
            <div className="merchant-avatar">
              {user?.merchant?.logo || '🏪'}
            </div>
            <div className="merchant-info">
              <h2>{user?.merchant?.name}</h2>
              <p>{user?.merchant?.category}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => navigate('/my-cards')}>
              🎴 My Cards
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {dashboardData && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon active">
                <span>📇</span>
              </div>
              <div className="stat-content">
                <h3>Active Cards</h3>
                <p className="stat-value">{dashboardData.activeCards}</p>
                <p className="stat-label">Current active stamp cards</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon rewards">
                <span>🎁</span>
              </div>
              <div className="stat-content">
                <h3>Total Rewards</h3>
                <p className="stat-value">{dashboardData.totalRewards}</p>
                <p className="stat-label">Rewards earned by customers</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon redeemed">
                <span>✓</span>
              </div>
              <div className="stat-content">
                <h3>Redeemed</h3>
                <p className="stat-value">{dashboardData.redeemedRewards}</p>
                <p className="stat-label">
                  {dashboardData.totalRewards > 0 
                    ? `${Math.round((dashboardData.redeemedRewards / dashboardData.totalRewards) * 100)}% redemption rate`
                    : 'No rewards yet'}
                </p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pending">
                <span>⏳</span>
              </div>
              <div className="stat-content">
                <h3>Pending</h3>
                <p className="stat-value">{dashboardData.pendingRewards}</p>
                <p className="stat-label">Rewards waiting to be redeemed</p>
              </div>
            </div>
          </div>
        )}

      {/* QR Code Section */}
      <div className="qr-code-section">
        <div className="qr-code-card">
          <div className="qr-code-header">
            <div>
              <h3>Customer QR Code</h3>
              <p>Customers scan this code to join your loyalty program</p>
            </div>
            <div className="qr-code-actions">
              {qrCode && (
                <button 
                  className="btn-download"
                  onClick={handleDownloadQR}
                  title="Download QR Code"
                >
                  ⬇️ Download
                </button>
              )}
              <button 
                className="btn-regenerate"
                onClick={handleGenerateQR}
                disabled={generatingQr}
              >
                {generatingQr ? '🔄 Generating...' : qrCode ? '🔄 Regenerate' : '✨ Generate QR Code'}
              </button>
            </div>
          </div>
          
          {qrCode ? (
            <div className="qr-code-display">
              <img src={qrCode} alt="Merchant QR Code" className="qr-code-image" />
              <p className="qr-code-hint">
                💡 Print this QR code and display it at your business so customers can easily scan and join!
              </p>
            </div>
          ) : (
            <div className="qr-code-placeholder">
              <div className="qr-placeholder-icon">📱</div>
              <p>No QR code generated yet</p>
              <p className="qr-placeholder-hint">
                Click "Generate QR Code" to create a scannable code for your customers
              </p>
            </div>
          )}
        </div>
      </div>

        <div className="charts-container">
          <div className="chart-card">
            <h3>New Cards Created (Last 30 Days)</h3>
            {newCardsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={newCardsData}>
                  <defs>
                    <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4db8a8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4db8a8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#718096"
                  />
                  <YAxis stroke="#718096" />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#4db8a8" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCards)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">No new cards data available</p>
            )}
          </div>

          <div className="chart-card">
            <h3>Daily Stamp Activity (Last 30 Days)</h3>
            {stampActivityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stampActivityData}>
                  <defs>
                    <linearGradient id="colorStamps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4db8a8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4db8a8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#718096"
                  />
                  <YAxis stroke="#718096" />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="stamps" 
                    stroke="#4db8a8" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStamps)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">No stamp activity data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
