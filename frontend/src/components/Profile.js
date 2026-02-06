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
  
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        businessName: user.businessName || '',
        email: user.email || ''
      }));
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

  return (
    <>
      <NavBar />
      <div className="page-with-navbar profile-page">
        <div className="profile-container">
          {/* Header */}
          <div className="profile-header">
            <div className="profile-avatar">
              <span>{user?.businessName?.charAt(0).toUpperCase() || '?'}</span>
            </div>
            <h1>{user?.businessName || 'Profile'}</h1>
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

          {/* Account Stats */}
          <div className="profile-stats">
            <div className="stat-card">
              <span className="stat-icon">🎴</span>
              <div className="stat-content">
                <p className="stat-label">Active Cards</p>
                <p className="stat-value">{user?.activeMerchantId ? '1' : '0'}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📅</span>
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
