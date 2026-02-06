import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Pricing.css';

function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="pricing-page">
      {/* Navigation */}
      <nav className="pricing-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">Poossh Stamp</span>
          </Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/pricing" className="active">Pricing</Link>
            <Link to="/login">Log In</Link>
            <Link to="/signup" className="btn-nav-signup">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pricing-hero">
        <div className="pricing-hero-content">
          <h1>Choose your plan.</h1>
          <p>Flexible subscriptions for every business.</p>
          <a href="mailto:contact@poossh.com" className="btn-contact-support">
            Contact Support
          </a>
          <p className="contact-subtitle">Questions about plans? Email us at contact@poossh.com</p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-section">
        <div className="pricing-container">
          <div className="pricing-header">
            <h2>Pricing</h2>
            <p>No hidden fees.</p>
            <button className="btn-view-template">✦ View Template</button>
          </div>

          <div className="pricing-cards">
            {/* Starter Plan */}
            <div className="pricing-card">
              <div className="card-header">
                <h3>Starter</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">45</span>
                  <span className="period">/mo</span>
                </div>
              </div>
              <ul className="features-list">
                <li>✓ Unlimited stamps</li>
                <li>✓ Single stamp card</li>
                <li>✓ Single location</li>
                <li>✓ Basic analytics</li>
                <li>✓ Email support</li>
              </ul>
              <button className="btn-plan btn-plan-free" onClick={() => navigate('/signup')}>
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card">
              <div className="card-header">
                <h3>Pro</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">100</span>
                  <span className="period">/mo</span>
                </div>
              </div>
              <ul className="features-list">
                <li>✓ Unlimited stamps</li>
                <li>✓ Multiple stamp cards</li>
                <li>✓ Multiple locations</li>
                <li>✓ Advanced insights</li>
                <li>✓ Email support</li>
              </ul>
              <button className="btn-plan btn-plan-pro" onClick={() => navigate('/signup')}>
                Get Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-container">
          <div className="benefit-card">
            <div className="benefit-icon">
              <div className="icon-box">1</div>
            </div>
            <h3>Easy setup</h3>
            <p>Create your loyalty program in minutes. No credit card required to start.</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">
              <div className="icon-box">2</div>
            </div>
            <h3>Custom rewards</h3>
            <p>Set your own rewards and stamp requirements. Full control over your program.</p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">
              <div className="icon-box">3</div>
            </div>
            <h3>Insightful analytics</h3>
            <p>Track customer behavior and program performance with real-time analytics.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pricing-cta-section">
        <div className="pricing-cta-content">
          <h2>Ready to boost loyalty?</h2>
          <p>Start your free trial today</p>
          <button className="btn-cta-primary" onClick={() => navigate('/signup')}>
            Get Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="pricing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">✦</span>
              <span className="logo-text">Poossh Stamp</span>
            </div>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <Link to="/#how-it-works">How It Works</Link>
              <Link to="/#features">Features</Link>
              <Link to="/pricing">Pricing</Link>
            </div>
            
            <div className="footer-column">
              <h4>Company</h4>
              <Link to="/#about">About Poossh Stamp</Link>
              <a href="mailto:contact@poossh.com">Contact</a>
              <Link to="/#blog">Blog</Link>
            </div>
            
            <div className="footer-column">
              <h4>Resources</h4>
              <Link to="/pricing">Subscription Info</Link>
              <a href="mailto:contact@poossh.com">Help Center</a>
              <Link to="/login">Log In</Link>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2026 Poossh Stamp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Pricing;
