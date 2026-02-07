import React from 'react';
import './PlanChangeModal.css';

function PlanChangeModal({ isOpen, onClose, onConfirm, currentPlan, newPlan, loading }) {
  if (!isOpen) return null;

  const isUpgrade = newPlan === 'pro';
  const currentPlanName = currentPlan === 'starter' ? 'Starter' : 'Pro';
  const newPlanName = newPlan === 'starter' ? 'Starter' : 'Pro';
  const currentPrice = currentPlan === 'starter' ? '$45' : '$100';
  const newPrice = newPlan === 'starter' ? '$45' : '$100';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className={`modal-icon ${isUpgrade ? 'upgrade' : 'downgrade'}`}>
            {isUpgrade ? '✦' : '↓'}
          </div>
          <h2>{isUpgrade ? 'Upgrade to Pro' : 'Downgrade to Starter'}</h2>
          <p className="modal-subtitle">
            {isUpgrade 
              ? 'Unlock advanced features and create unlimited stamp cards'
              : 'Switch back to a single card plan'}
          </p>
        </div>

        <div className="modal-body">
          <div className="plan-comparison">
            <div className="plan-column current-plan">
              <span className="plan-label">Current Plan</span>
              <div className="plan-name">{currentPlanName}</div>
              <div className="plan-price">{currentPrice}/mo</div>
            </div>

            <div className="plan-arrow">→</div>

            <div className="plan-column new-plan">
              <span className="plan-label">New Plan</span>
              <div className="plan-name">{newPlanName}</div>
              <div className="plan-price">{newPrice}/mo</div>
            </div>
          </div>

          <div className="billing-info">
            <div className="info-item">
              <span className="info-icon">💳</span>
              <div className="info-text">
                <strong>Billing</strong>
                <p>Your card will be charged the prorated amount immediately</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">⚡</span>
              <div className="info-text">
                <strong>Instant Access</strong>
                <p>Changes take effect immediately after confirmation</p>
              </div>
            </div>
            {isUpgrade && (
              <div className="info-item">
                <span className="info-icon">✓</span>
                <div className="info-text">
                  <strong>What You Get</strong>
                  <p>Multiple cards, advanced analytics, priority support</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-modal-cancel" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className={`btn-modal-confirm ${isUpgrade ? 'upgrade' : 'downgrade'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Processing...
              </>
            ) : (
              <>
                {isUpgrade ? 'Confirm Upgrade' : 'Confirm Downgrade'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlanChangeModal;
