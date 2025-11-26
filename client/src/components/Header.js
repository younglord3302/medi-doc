import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>Medi-Doc</h1>
        </div>
        <nav className="nav">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/patients" className="nav-link">Patients</Link>
          <Link to="/records" className="nav-link">Medical Records</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
