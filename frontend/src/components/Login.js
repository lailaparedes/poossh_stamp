import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const useDemoAccount = () => {
    setEmail('jc@mail.com');
    setPassword('password123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      setTimeout(() => {
        navigate('/my-cards');
      }, 100);
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Navigation */}
      <nav className="login-nav">
        <div className="nav-content">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">Poossh Stamp</span>
          </Link>
          <Link to="/signup" className="btn-nav-signup">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="login-main">
        <div className="login-content">
          <div className="login-header">
            <h1>Welcome back</h1>
            <p>Log in to your merchant account.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-forgot" 
                onClick={() => alert('Please contact support at support@poossh.com')}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="demo-section">
              <div className="demo-divider">
                <span>or try demo</span>
              </div>
              <button 
                type="button" 
                className="btn-demo" 
                onClick={useDemoAccount}
              >
                Use Demo Account
              </button>
              <p className="demo-hint">Email: jc@mail.com • Password: password123</p>
            </div>

            <div className="form-footer">
              <p>
                Don't have an account? <Link to="/signup">Sign up</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
