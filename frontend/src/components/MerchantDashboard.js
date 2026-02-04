import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './MerchantDashboard.css';

function MerchantDashboard() {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  
  const [merchant, setMerchant] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [newCardsData, setNewCardsData] = useState([]);
  const [stampActivityData, setStampActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch merchant info
      const merchantRes = await axios.get(`/api/merchants/${merchantId}`);
      setMerchant(merchantRes.data.data);

      // Fetch dashboard analytics
      const dashboardRes = await axios.get(`/api/analytics/${merchantId}/dashboard`);
      setDashboardData(dashboardRes.data.data);

      // Fetch new cards data
      const newCardsRes = await axios.get(`/api/analytics/${merchantId}/new-cards-daily`);
      setNewCardsData(newCardsRes.data.data);

      // Fetch stamp activity
      const stampActivityRes = await axios.get(`/api/analytics/${merchantId}/stamp-activity`);
      setStampActivityData(stampActivityRes.data.data);

      setLoading(false);
    } catch (err) {
      setError('Failed to load merchant data');
      setLoading(false);
      console.error(err);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="merchant-dashboard">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to Merchants
      </button>

      {merchant && (
        <div className="merchant-header" style={{ borderLeftColor: merchant.color }}>
          {merchant.logo && (
            <div className="header-logo">
              <img src={merchant.logo} alt={merchant.name} />
            </div>
          )}
          <div>
            <h2>{merchant.name}</h2>
            <p className="merchant-category">{merchant.category}</p>
          </div>
        </div>
      )}

      {dashboardData && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#667eea' }}>
              <span>📇</span>
            </div>
            <div className="stat-content">
              <h3>Active Cards</h3>
              <p className="stat-value">{dashboardData.activeCards}</p>
              <p className="stat-label">Current active stamp cards</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f56565' }}>
              <span>🎁</span>
            </div>
            <div className="stat-content">
              <h3>Total Rewards</h3>
              <p className="stat-value">{dashboardData.totalRewards}</p>
              <p className="stat-label">Rewards earned by customers</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#48bb78' }}>
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
            <div className="stat-icon" style={{ background: '#ed8936' }}>
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

      <div className="charts-container">
        <div className="chart-card">
          <h3>New Cards Created (Last 30 Days)</h3>
          {newCardsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={newCardsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Bar dataKey="count" fill="#667eea" name="New Cards" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No new cards data available</p>
          )}
        </div>

        <div className="chart-card">
          <h3>Daily Stamp Activity (Last 30 Days)</h3>
          {stampActivityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stampActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="stamps" 
                  stroke="#48bb78" 
                  strokeWidth={2}
                  name="Stamps Issued"
                  dot={{ fill: '#48bb78' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No stamp activity data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MerchantDashboard;
