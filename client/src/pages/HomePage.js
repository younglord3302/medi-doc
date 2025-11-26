import React from 'react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage">
      <div className="hero">
        <h1>Welcome to Medi-Doc</h1>
        <p>A comprehensive medical records management system</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Patients</h3>
          <div className="stat-number">0</div>
          <p className="stat-description">Registered patients</p>
        </div>

        <div className="stat-card">
          <h3>Medical Records</h3>
          <div className="stat-number">0</div>
          <p className="stat-description">Total records</p>
        </div>

        <div className="stat-card">
          <h3>Today's Appointments</h3>
          <div className="stat-number">0</div>
          <p className="stat-description">Scheduled visits</p>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn primary">Add New Patient</button>
          <button className="action-btn secondary">Create Medical Record</button>
          <button className="action-btn secondary">Schedule Appointment</button>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          <p className="no-activity">No recent activity to display</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
