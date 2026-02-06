import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'my-cards', label: 'My Cards', icon: '🎴', path: '/my-cards' },
    { id: 'customers', label: 'Customers', icon: '👥', path: '/customers' },
    { id: 'rewards', label: 'Rewards', icon: '🎁', path: '#', disabled: true },
  ];

  const accountItems = [
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '#', disabled: true },
    { id: 'help', label: 'Help & Support', icon: '❓', path: '#', disabled: true },
  ];

  const handleMenuClick = (item) => {
    if (!item.disabled) {
      navigate(item.path);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">✦</div>
        <div className="sidebar-title">
          <h2>Poossh Stamp</h2>
          <p>Merchant Portal</p>
        </div>
      </div>

      <div className="sidebar-menu">
        <div className="menu-section">
          <div className="menu-section-title">Main Menu</div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              onClick={() => handleMenuClick(item)}
              disabled={item.disabled}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="menu-section">
          <div className="menu-section-title">Account</div>
          {accountItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${item.disabled ? 'disabled' : ''}`}
              onClick={() => handleMenuClick(item)}
              disabled={item.disabled}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button className="menu-item" onClick={handleLogout}>
            <span className="menu-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
