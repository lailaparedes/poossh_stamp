import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UpgradePromptModal.css';

function UpgradePromptModal({ isOpen, onClose, currentCardCount }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    navigate('/profile');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upgrade-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="upgrade-modal-header">
          <div className="upgrade-icon">🚀</div>
          <h2>Upgrade to Pro</h2>
          <p className="upgrade-subtitle">
            You've reached the limit for Starter plan
          </p>
        </div>

        <div className="upgrade-modal-body">
          <div className="limit-info">
            <div className="limit-badge">
              <span className="limit-current">{currentCardCount}</span>
              <span className="limit-divider">/</span>
              <span className="limit-max">2</span>
            </div>
            <p className="limit-text">Cards Created</p>
          </div>

          <div className="upgrade-benefits">
            <h3>Unlock with Pro:</h3>
            <div className="benefit-list">
              <div className="benefit-item">
                <span className="benefit-icon">✦</span>
                <span>Create unlimited stamp cards</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span>Advanced analytics and insights</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">⚡</span>
                <span>Priority customer support</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎯</span>
                <span>Custom branding options</span>
              </div>
            </div>
          </div>

          <div className="pricing-display">
            <div className="price-tag">
              <span className="price-amount">$100</span>
              <span className="price-period">/month</span>
            </div>
            <p className="price-note">Upgrade anytime, cancel anytime</p>
          </div>
        </div>

        <div className="upgrade-modal-footer">
          <button className="btn-upgrade-later" onClick={onClose}>
            Maybe Later
          </button>
          <button className="btn-upgrade-now" onClick={handleUpgrade}>
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradePromptModal;
