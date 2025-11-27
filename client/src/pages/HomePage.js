import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const res = await api.get("/auth/dashboard");
      setDashboardData(res.data.data);
    } catch (err) {
      console.error("Dashboard data load failed", err);
      // Set default values if API fails
      setDashboardData({
        statistics: {
          totalPatients: 0,
          totalRecords: 0,
          todayAppointments: 0,
          totalAppointments: 0,
          activeUsers: 0
        },
        recentActivity: []
      });
    }
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);

      // Check API health
      try {
        const healthRes = await api.get("/health");
        setHealth(healthRes.data);
        setHealthError("");
      } catch (err) {
        console.error("Health check failed", err);
        setHealthError("Frontend cannot reach backend API");
      }

      // Load dashboard data
      await loadDashboardData();

      setLoading(false);
    };

    initializePage();
  }, [loadDashboardData]);

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleDashboardRefresh = () => {
      loadDashboardData();
    };

    // Listen for custom events
    window.addEventListener('dashboard-refresh', handleDashboardRefresh);

    // Also listen for storage changes (in case other tabs trigger refresh)
    const handleStorageChange = (e) => {
      if (e.key === 'dashboard-refresh') {
        loadDashboardData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('dashboard-refresh', handleDashboardRefresh);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadDashboardData]);

  return (
    <div className="homepage">
      {/* Connectivity Status */}
      <div className="api-connectivity-card">
        <div className="api-connectivity-header">
          <div className="api-connectivity-icon">
            {healthError ? (
              <div className="status-indicator error">
                <div className="status-dot error"></div>
                <span className="status-text">Offline</span>
              </div>
            ) : health ? (
              <div className="status-indicator success">
                <div className="status-pulse"></div>
                <div className="status-dot success"></div>
                <span className="status-text">Online</span>
              </div>
            ) : (
              <div className="status-indicator loading">
                <div className="status-spinner"></div>
                <span className="status-text">Checking...</span>
              </div>
            )}
          </div>
          <div className="api-connectivity-title">
            <h3>System Status</h3>
            <p>API Connectivity & Health</p>
          </div>
        </div>

        <div className="api-connectivity-content">
          {healthError && (
            <div className="connectivity-error">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <h4>Connection Failed</h4>
                <p>{healthError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="retry-button"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {health && (
            <div className="connectivity-success">
              <div className="server-info-grid">
                <div className="server-info-item">
                  <div className="info-label">Service</div>
                  <div className="info-value">{health.service}</div>
                </div>
                <div className="server-info-item">
                  <div className="info-label">Environment</div>
                  <div className="info-value environment">{health.env}</div>
                </div>
                <div className="server-info-item">
                  <div className="info-label">Server Time</div>
                  <div className="info-value">
                    {new Date(health.time).toLocaleString("en-IN", {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'short',
                      timeStyle: 'medium'
                    })}
                  </div>
                </div>
                <div className="server-info-item">
                  <div className="info-label">Status</div>
                  <div className="info-value status-healthy">
                    <span className="status-badge">Healthy</span>
                  </div>
                </div>
              </div>

              <div className="connectivity-metrics">
                <div className="metric-item">
                  <div className="metric-icon">🌐</div>
                  <div className="metric-info">
                    <div className="metric-value">Active</div>
                    <div className="metric-label">API Gateway</div>
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-icon">🗄️</div>
                  <div className="metric-info">
                    <div className="metric-value">Connected</div>
                    <div className="metric-label">Database</div>
                  </div>
                </div>
                <div className="metric-item">
                  <div className="metric-icon">⚡</div>
                  <div className="metric-info">
                    <div className="metric-value">Optimized</div>
                    <div className="metric-label">Performance</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!health && !healthError && (
            <div className="connectivity-loading">
              <div className="loading-animation">
                <div className="loading-dots">
                  <div className="dot dot-1"></div>
                  <div className="dot dot-2"></div>
                  <div className="dot dot-3"></div>
                </div>
                <p>Establishing connection to backend services...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="homepage-content">
      <div className="hero">
        <div className="hero-content">
          <div className="hero-icon">🏥</div>
          <h1>Welcome to Medi-Doc</h1>
          <p>A comprehensive medical records management system designed for modern healthcare professionals</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">100%</span>
              <span className="stat-label">Secure</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">HIPAA</span>
              <span className="stat-label">Compliant</span>
            </div>
          </div>
        </div>
        <div className="hero-bg-pattern"></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Patients</h3>
          <div className="stat-number">
            {loading ? '...' : (dashboardData?.statistics?.totalPatients || 0)}
          </div>
          <p className="stat-description">Registered patients</p>
        </div>

        <div className="stat-card">
          <h3>Medical Records</h3>
          <div className="stat-number">
            {loading ? '...' : (dashboardData?.statistics?.totalRecords || 0)}
          </div>
          <p className="stat-description">Total records</p>
        </div>

        <div className="stat-card">
          <h3>Today's Appointments</h3>
          <div className="stat-number">
            {loading ? '...' : (dashboardData?.statistics?.todayAppointments || 0)}
          </div>
          <p className="stat-description">Scheduled visits</p>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button
            className="action-btn primary"
            onClick={() => navigate('/patients')}
          >
            Add New Patient
          </button>
          <button
            className="action-btn secondary"
            onClick={() => navigate('/patients')}
          >
            Create Medical Record
          </button>
          <button
            className="action-btn secondary"
            onClick={() => navigate('/appointments')}
          >
            Schedule Appointment
          </button>
        </div>
      </div>

        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {loading ? (
              <p className="no-activity">Loading recent activity...</p>
            ) : dashboardData?.recentActivity?.length > 0 ? (
              dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-header">
                    <span className="activity-action">{activity.action.replace('_', ' ')}</span>
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="activity-details">
                    <span className="activity-target">{activity.targetType}</span>
                    {activity.user && (
                      <span className="activity-user">by {activity.user.name}</span>
                    )}
                  </div>
                  {activity.meta && (
                    <div className="activity-meta">
                      {activity.meta.patientId && <span>Patient: {activity.meta.patientId}</span>}
                      {activity.meta.doctorId && <span>Doctor: {activity.meta.doctorId}</span>}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-activity">No recent activity to display</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
