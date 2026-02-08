import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    category: 'Restaurant'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const categories = [
    'Restaurant',
    'Coffee Shop',
    'Bakery',
    'Retail',
    'Salon/Spa',
    'Fitness',
    'Other'
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Register new merchant
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Signup failed. Please try again.');
        setLoading(false);
        return;
      }

      // Auto-login after signup
      const loginResult = await login(formData.email, formData.password);
      
      if (loginResult.success) {
        setTimeout(() => {
          navigate('/select-plan');
        }, 100);
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Navigation */}
      <nav className="signup-nav">
        <div className="nav-content">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">Poossh Stamp</span>
          </Link>
          <Link to="/login" className="btn-nav-login">
            Log In
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="signup-main">
        <div className="signup-content">
          <div className="signup-header">
            <h1>Create your account</h1>
            <p>Start your digital loyalty program today.</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="form-section">
              <h2>Business Information</h2>
              
              <div className="form-group">
                <label htmlFor="businessName">Business Name</label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Your Coffee Shop"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Business Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-section">
              <h2>Account Details</h2>
              
              <div className="form-group">
                <label htmlFor="ownerName">Your Name</label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number (Optional)</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Security</h2>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  required
                  disabled={loading}
                  minLength={8}
                />
                <span className="input-hint">Use at least 8 characters</span>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn-signup" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="form-footer">
              <p>
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
