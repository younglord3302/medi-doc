import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './PatientsPage.css';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients');
      // For now, use mock data since API is placeholder
      setPatients(response.data.data || []);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="patients-page">
        <h1>Patients</h1>
        <div className="loading">Loading patients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patients-page">
        <h1>Patients</h1>
        <div className="error">{error}</div>
        <button onClick={fetchPatients} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="patients-page">
      <div className="page-header">
        <h1>Patients</h1>
        <button className="add-patient-btn">Add New Patient</button>
      </div>

      {patients.length === 0 ? (
        <div className="no-patients">
          <p>No patients found. Add your first patient to get started.</p>
        </div>
      ) : (
        <div className="patients-grid">
          {patients.map((patient) => (
            <div key={patient.id} className="patient-card">
              <h3>{patient.firstName} {patient.lastName}</h3>
              <p>{patient.email}</p>
              <div className="patient-actions">
                <button className="view-btn">View Details</button>
                <button className="edit-btn">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
