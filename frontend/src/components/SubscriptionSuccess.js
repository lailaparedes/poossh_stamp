import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './SubscriptionSuccess.css';

function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState('');
  const { updateToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setError('No session found');
        setVerifying(false);
        return;
      }

      try {
        const token = localStorage.getItem('merchantToken');
        
        const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setPlan(data.plan);
          // Refresh the auth token to get updated user data
          if (updateToken) {
            await updateToken();
          }
          setVerifying(false);
        } else {
          setError(data.error || 'Verification failed');
          setVerifying(false);
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Failed to verify payment');
        setVerifying(false);
      }
    };

    verifySession();
  }, [searchParams, updateToken]);

  const handleContinue = () => {
    navigate('/setup');
  };

  if (verifying) {
    return (
      <div className="subscription-success-container">
        <div className="success-content">
          <div className="loading-spinner"></div>
          <h2>Verifying your payment...</h2>
          <p>Please wait while we confirm your subscription.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-success-container">
        <div className="success-content">
          <div className="error-icon">⚠️</div>
          <h2>Verification Failed</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/select-plan')} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-success-container">
      <div className="success-content">
        <div className="success-icon">✓</div>
        <h1>Welcome to Poossh Stamp!</h1>
        <p className="success-message">
          Your {plan === 'starter' ? 'Starter' : 'Pro'} subscription is now active.
        </p>
        <div className="success-details">
          <div className="detail-item">
            <span className="detail-icon">✓</span>
            <span>Payment confirmed</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">✓</span>
            <span>Account activated</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">✓</span>
            <span>Ready to create your first card</span>
          </div>
        </div>
        <button onClick={handleContinue} className="btn-continue">
          Get Started
        </button>
        <p className="receipt-note">
          A receipt has been sent to your email address.
        </p>
      </div>
    </div>
  );
}

export default SubscriptionSuccess;
