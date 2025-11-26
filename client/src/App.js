import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PatientsPage from './pages/PatientsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/records" element={<div className="coming-soon">Medical Records page coming soon...</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
