import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './NavBar.css';

function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '' },
    { path: '/my-cards', label: 'My Cards', icon: '🎴' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/dashboard" className="navbar-logo">
          <span className="logo-icon">✦</span>
          <span className="logo-text">Poossh Stamp</span>
        </Link>

        {/* Navigation Links */}
        <div className="navbar-links">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <button className="btn-logout" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
