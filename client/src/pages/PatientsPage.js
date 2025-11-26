import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PatientModal from '../components/PatientModal';
import './PatientsPage.css';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (err) {
      setError('Failed to load patients from API');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (patientData) => {
    try {
      await api.post('/patients', patientData);
      await fetchPatients(); // Refresh the list
    } catch (err) {
      console.error('Error adding patient:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

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
        <button onClick={openModal} className="add-patient-btn">Add New Patient</button>
      </div>

      {patients.length === 0 ? (
        <div className="no-patients">
          <p>No patients found. Add your first patient to get started.</p>
        </div>
      ) : (
        <div className="patients-grid">
          {patients.map((patient) => (
            <div key={patient._id} className="patient-card">
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

      <PatientModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleAddPatient}
      />
    </div>
  );
};

export default PatientsPage;
