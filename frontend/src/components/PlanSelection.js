import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PlanSelection.css';

function PlanSelection() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('merchantToken');
      
      console.log('Token retrieved:', token ? 'YES' : 'NO');
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to create checkout session');
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to start checkout process. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="plan-selection-container">
      <div className="plan-selection-content">
        <div className="plan-header">
          <div className="logo-section">
            <span className="logo-icon">✦</span>
            <span className="logo-text">Poossh Stamp</span>
          </div>
          <h1>Choose your plan</h1>
          <p>Welcome, {user?.businessName || user?.fullName}! Select a plan to get started.</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="plans-grid">
          {/* Starter Plan */}
          <div className="plan-card">
            <div className="plan-card-header">
              <h2>Starter</h2>
              <div className="plan-price">
                <span className="price-amount">$45</span>
                <span className="price-period">/month</span>
              </div>
            </div>
            <div className="plan-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Unlimited stamps</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Single stamp card</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Customer management</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Basic analytics</span>
              </div>
            </div>
            <button
              className={`btn-select-plan ${selectedPlan === 'starter' ? 'loading' : ''}`}
              onClick={() => handleSelectPlan('starter')}
              disabled={loading}
            >
              {loading && selectedPlan === 'starter' ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                'Select Starter'
              )}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="plan-card plan-card-featured">
            <div className="plan-badge">Most Popular</div>
            <div className="plan-card-header">
              <h2>Pro</h2>
              <div className="plan-price">
                <span className="price-amount">$100</span>
                <span className="price-period">/month</span>
              </div>
            </div>
            <div className="plan-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Everything in Starter</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Multiple stamp cards</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Advanced analytics</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Priority support</span>
              </div>
            </div>
            <button
              className={`btn-select-plan btn-select-plan-featured ${selectedPlan === 'pro' ? 'loading' : ''}`}
              onClick={() => handleSelectPlan('pro')}
              disabled={loading}
            >
              {loading && selectedPlan === 'pro' ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                'Select Pro'
              )}
            </button>
          </div>
        </div>

        <div className="plan-footer">
          <button 
            className="btn-skip-plan"
            onClick={() => navigate('/setup')}
            disabled={loading}
          >
            Skip for now
          </button>
          <p>
            Need help deciding? <a href="mailto:contact@poossh.com">Contact our team</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PlanSelection;
