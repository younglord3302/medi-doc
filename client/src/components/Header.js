import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🏥</span>
          <div>
            <h1>Medi-Doc</h1>
            <span className="subtitle">Medical Records System</span>
          </div>
        </Link>

        <nav className="nav">
          {isAuthenticated() ? (
            <>
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/patients" className="nav-link">Patients</Link>
              <Link to="/appointments" className="nav-link">Appointments</Link>
              {user?.role === 'admin' && (
                <Link to="/admin/audit-logs" className="nav-link admin-link">Audit Logs</Link>
              )}

              <div className="user-info">
                <div className="user-avatar">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="user-role">
                    <span className="user-role-badge">{user?.role}</span>
                    {user?.specialization && ` · ${user.specialization}`}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn-compact" title="Logout">
                <span className="logout-icon">🚪</span>
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="nav-link login-link">Login</Link>
              <Link to="/register" className="nav-link register-link">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
