import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GracePeriodBanner.css';

function GracePeriodBanner({ daysRemaining, onDismiss }) {
  const navigate = useNavigate();

  if (!daysRemaining || daysRemaining <= 0) return null;

  const handleResubscribe = () => {
    navigate('/profile');
  };

  return (
    <div className="grace-period-banner">
      <div className="banner-content">
        <div className="banner-icon">⚠️</div>
        <div className="banner-text">
          <strong>Subscription Canceled</strong>
          <p>
            Your loyalty cards will be deactivated in <span className="days-remaining">{daysRemaining} days</span>.
            Resubscribe to keep them active.
          </p>
        </div>
        <div className="banner-actions">
          <button className="btn-banner-resubscribe" onClick={handleResubscribe}>
            Resubscribe Now
          </button>
          <button className="btn-banner-dismiss" onClick={onDismiss}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default GracePeriodBanner;
