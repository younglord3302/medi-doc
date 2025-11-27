import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientsPage from './pages/PatientsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<ProtectedRoute requireAuth={false}><LoginPage /></ProtectedRoute>} />
            <Route path="/register" element={<ProtectedRoute requireAuth={false}><RegisterPage /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
            <Route path="/patients/:patientId/records" element={<ProtectedRoute><MedicalRecordsPage /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogsPage /></AdminRoute>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
