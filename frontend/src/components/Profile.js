import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import NavBar from './NavBar';
import './Profile.css';

function Profile() {
  const { user, updateToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [merchantCount, setMerchantCount] = useState(0);
  const [billingLoading, setBillingLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchMerchantCount = async () => {
      try {
        const response = await axios.get('/api/merchants');
        setMerchantCount(response.data.data?.length || 0);
      } catch (err) {
        console.error('Error fetching merchant count:', err);
      }
    };

    if (user) {
      // Use account business name (not individual card names)
      const businessName = user.businessName || user.fullName || '';
      
      setFormData(prev => ({
        ...prev,
        businessName: businessName,
        email: user.email || ''
      }));

      fetchMerchantCount();
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updateData = {
        businessName: formData.businessName
      };

      // Only include password fields if user wants to change password
      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setErrorMessage('New passwords do not match');
          setLoading(false);
          return;
        }
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await axios.put('/api/auth/profile', updateData);
      
      if (response.data.data?.token) {
        await updateToken(response.data.data.token);
      }

      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to update profile');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(prev => ({
      ...prev,
      businessName: user.businessName || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    setErrorMessage(null);
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    setErrorMessage(null);

    try {
      const response = await axios.post('/api/stripe/create-portal-session');
      
      if (response.data.success) {
        // Redirect to Stripe Customer Portal
        window.location.href = response.data.url;
      } else {
        setErrorMessage(response.data.error || 'Failed to open billing portal');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (err) {
      console.error('Billing portal error:', err);
      setErrorMessage('Failed to open billing portal. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setBillingLoading(false);
    }
  };

  const getSubscriptionBadge = (status) => {
    if (status === 'active') return { text: 'Active', className: 'badge-active' };
    if (status === 'past_due') return { text: 'Past Due', className: 'badge-warning' };
    if (status === 'canceled') return { text: 'Canceled', className: 'badge-canceled' };
    return { text: 'Inactive', className: 'badge-inactive' };
  };

  const getPlanName = (plan) => {
    if (plan === 'starter') return 'Starter';
    if (plan === 'pro') return 'Pro';
    return 'No Plan';
  };

  return (
    <>
      <NavBar />
      <div className="page-with-navbar profile-page">
        <div className="profile-container">
          {/* Header */}
          <div className="profile-header">
            <div className="profile-avatar">
              <span>{(user?.businessName || user?.fullName || '?').charAt(0).toUpperCase()}</span>
            </div>
            <h1>{user?.businessName || user?.fullName || 'Profile'}</h1>
            <p className="profile-email">{user?.email}</p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="message success-message">
              ✓ {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="message error-message">
              ✕ {errorMessage}
            </div>
          )}

          {/* Profile Form */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Account Information</h2>
              {!isEditing && (
                <button 
                  className="btn-edit"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="form-section">
                <h3>Business Details</h3>
                
                <div className="form-group">
                  <label>Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="disabled-input"
                  />
                  <small>Email cannot be changed</small>
                </div>
              </div>

              {isEditing && (
                <div className="form-section">
                  <h3>Change Password (Optional)</h3>
                  
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      minLength="8"
                    />
                    <small>Minimum 8 characters</small>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Subscription Section */}
          <div className="profile-card subscription-card">
            <div className="card-header">
              <h2>Subscription & Billing</h2>
            </div>

            <div className="subscription-details">
              <div className="subscription-info">
                <div className="subscription-plan">
                  <span className="plan-label">Current Plan</span>
                  <div className="plan-name-container">
                    <span className="plan-name">{getPlanName(user?.subscriptionPlan)}</span>
                    <span className={`subscription-badge ${getSubscriptionBadge(user?.subscriptionStatus).className}`}>
                      {getSubscriptionBadge(user?.subscriptionStatus).text}
                    </span>
                  </div>
                </div>

                {user?.subscriptionPlan && (
                  <div className="plan-features">
                    {user.subscriptionPlan === 'starter' && (
                      <>
                        <div className="feature-item">✓ Unlimited stamps</div>
                        <div className="feature-item">✓ Single stamp card</div>
                        <div className="feature-item">✓ Basic analytics</div>
                      </>
                    )}
                    {user.subscriptionPlan === 'pro' && (
                      <>
                        <div className="feature-item">✓ Everything in Starter</div>
                        <div className="feature-item">✓ Multiple stamp cards</div>
                        <div className="feature-item">✓ Advanced analytics</div>
                        <div className="feature-item">✓ Priority support</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="billing-actions">
                <button
                  className="btn-manage-billing"
                  onClick={handleManageBilling}
                  disabled={billingLoading || !user?.stripeCustomerId}
                >
                  {billingLoading ? (
                    <>
                      <span className="spinner-small"></span>
                      Loading...
                    </>
                  ) : (
                    <>
                      Manage Billing
                      <span className="arrow">→</span>
                    </>
                  )}
                </button>
                <p className="billing-note">
                  Update payment method, view invoices, or manage your subscription
                </p>
              </div>
            </div>
          </div>

          {/* Account Stats */}
          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-content">
                <p className="stat-label">Active Cards</p>
                <p className="stat-value">{merchantCount}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <p className="stat-label">Member Since</p>
                <p className="stat-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
