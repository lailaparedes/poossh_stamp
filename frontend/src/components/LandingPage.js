import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">Poossh Stamp</span>
          </div>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <Link to="/pricing">Pricing</Link>
            <a href="#how-it-works">How it Works</a>
          </div>
          <button className="btn-nav-cta" onClick={() => navigate('/signup')}>
            Launch with Poossh
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-stars">
          <span className="star star-large" style={{top: '5%', left: '8%'}}>✦</span>
          <span className="star star-small" style={{top: '15%', left: '15%'}}>✦</span>
          <span className="star star-large" style={{top: '35%', left: '5%'}}>✦</span>
          <span className="star star-small" style={{top: '55%', left: '12%'}}>✦</span>
          <span className="star star-large" style={{top: '75%', left: '8%'}}>✦</span>
          <span className="star star-small" style={{top: '85%', left: '15%'}}>✦</span>
          
          <span className="star star-small" style={{top: '8%', right: '10%'}}>✦</span>
          <span className="star star-large" style={{top: '18%', right: '15%'}}>✦</span>
          <span className="star star-small" style={{top: '30%', right: '8%'}}>✦</span>
          <span className="star star-large" style={{top: '50%', right: '12%'}}>✦</span>
          <span className="star star-small" style={{top: '65%', right: '18%'}}>✦</span>
          <span className="star star-large" style={{top: '80%', right: '10%'}}>✦</span>
          
          <span className="star star-small" style={{top: '10%', left: '50%'}}>✦</span>
          <span className="star star-large" style={{top: '25%', left: '45%'}}>✦</span>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Poossh Stamp.</h1>
          <p className="hero-subtitle">Digital loyalty cards for businesses.</p>
          <button className="btn-primary-large" onClick={() => navigate('/signup')}>
            Create Loyalty Program
          </button>
        </div>
      </section>

      {/* Features Preview */}
      <section className="features-preview">
        <div className="preview-container">
          <h2 className="section-title">Create stamp cards in minutes.</h2>
          <p className="section-subtitle">Flexible rewards, simple setup.</p>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="feature-sections" id="features">
        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card feature-left">
            <div className="feature-text">
              <h3>Create stamp cards.</h3>
              <p>Set up your own digital loyalty program—perfect for coffee, restaurants and more.</p>
            </div>
            <div className="feature-visual">
              <div className="feature-placeholder">
                <img 
                  src={require('../assets/coffee-loyalty-card-5d3c26e3-ea37-4f26-949f-0a57ad922ff2.png')} 
                  alt="Stamp Cards" 
                  className="feature-image"
                />
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="feature-card feature-right">
            <div className="feature-visual">
              <div className="feature-placeholder">
                <img 
                  src={require('../assets/chart_replicated__1_-0f7240ef-c23b-489f-8dc7-b413ed7a7a1b.png')} 
                  alt="Analytics Dashboard" 
                  className="feature-image"
                />
              </div>
            </div>
            <div className="feature-text">
              <h3>Track business insights.</h3>
              <p>View customer activity and program performance in your dashboard.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="feature-card feature-left">
            <div className="feature-text">
              <h3>Grow customer loyalty.</h3>
              <p>Reward return visits and drive repeat business with smart digital cards.</p>
            </div>
            <div className="feature-visual">
              <div className="feature-placeholder">
                <img 
                  src={require('../assets/happy-speech-bubble__4_-1981a737-c390-4442-97c6-a615027e873b.png')} 
                  alt="Customer Loyalty" 
                  className="feature-image feature-image-small"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="how-it-works-container">
          <h2 className="section-title-dark">How Poossh Stamp Works</h2>
          <div className="how-it-works-content">
            <p className="how-it-works-text">
              Businesses sign up and create custom digital stamp cards tailored to their needs
              —such as 10 stamps for a free coffee. Easily design cards with unique rewards.
            </p>
            <p className="how-it-works-text">
              Owners access a dashboard to track card usage and insights to 
              better understand loyal customers and program effectiveness.
            </p>
            <div className="signature">Poossh</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-subtitle">Create your loyalty program today.</p>
          <button className="btn-cta-dark" onClick={() => navigate('/signup')}>
            Sign Up
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
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
              <a href="#how-it-works">How It Works</a>
              <a href="#features">Features</a>
              <Link to="/pricing">Pricing</Link>
            </div>
            
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About Poossh Stamp</a>
              <a href="mailto:contact@poossh.com">Contact</a>
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

export default LandingPage;
