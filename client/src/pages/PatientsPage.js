import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PatientModal from '../components/PatientModal';
import ErrorBanner from '../components/ErrorBanner';
import { useAuth } from '../contexts/AuthContext';
import './PatientsPage.css';

const PatientsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activePatientId, setActivePatientId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPatients(1);
  }, []);

  const fetchPatients = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/patients', {
        params: { page: pageToLoad },
      });

      setPatients(response.data?.data || []);
      setPagination(response.data?.pagination || null);
      setPage(response.data?.pagination?.page || pageToLoad);
    } catch (err) {
      setError('Failed to load patients. Please try again.');
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (patientData) => {
    try {
      await api.post('/patients', patientData);
      await refreshCurrentPage(); // Refresh the current page

      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      localStorage.setItem('dashboard-refresh', Date.now().toString());
    } catch (err) {
      console.error('Error adding patient:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.pages) {
      fetchPatients(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination && page > 1) {
      fetchPatients(page - 1);
    }
  };

  const refreshCurrentPage = () => {
    fetchPatients(page);
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setActivePatientId(null);
    setIsModalOpen(true);
  };

  const [editingPatient, setEditingPatient] = useState(null);

  const openEditModal = (patient) => {
    setIsEditMode(true);
    setActivePatientId(patient._id);
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setActivePatientId(null);
  };

  const openDeleteModal = (patient) => {
    setDeleteTarget(patient);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setIsDeleteModalOpen(false);
  };

  const handleSubmit = async (patientData) => {
    try {
      if (isEditMode && activePatientId) {
        await api.put(`/patients/${activePatientId}`, patientData);
      } else {
        await api.post('/patients', patientData);
      }
      await refreshCurrentPage(); // Refresh the current page
      closeModal();

      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      localStorage.setItem('dashboard-refresh', Date.now().toString());
    } catch (err) {
      console.error('Error saving patient:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await api.delete(`/patients/${deleteTarget._id}`);
      closeDeleteModal();
      await refreshCurrentPage(); // Refresh the current page

      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      localStorage.setItem('dashboard-refresh', Date.now().toString());
    } catch (err) {
      console.error('Error deleting patient:', err);
      alert('Failed to delete patient. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="patients-page">
        <div className="loading">
          <div className="loading-content">
            <div className="loading-icon">🏥</div>
            <p>Loading patients...</p>
            <div className="loading-dots">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="patients-page">
        <div className="error">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Connection Error</h3>
            <p>{error}</p>
            <button onClick={fetchPatients} className="retry-btn">
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patients-page">
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1>Patients</h1>
            <p style={{color: 'var(--gray-600)', fontSize: 'var(--text-sm)', margin: '0.5rem 0 0 0'}}>
              Manage patient demographics and basic clinical info.
            </p>
          </div>
          <button onClick={openCreateModal} className="add-patient-btn">
            + Add Patient
          </button>
        </div>
      </div>

      <ErrorBanner message={error} />

      {patients.length === 0 ? (
        <div className="no-patients">
          <div className="no-patients-content">
            <div className="no-patients-icon">🏥</div>
            <h3>Welcome to Patient Management</h3>
            <p>No patients found in the system. Add your first patient to get started with managing medical records and appointments.</p>
          </div>
        </div>
      ) : (
        <div className="patients-grid">
          {patients.map((patient) => (
            <div key={patient._id} className="patient-card">
              <div className="patient-header">
                <div className="patient-avatar">
                  {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                </div>
                <div className="patient-info">
                  <h3>{patient.firstName} {patient.lastName}</h3>
                  <div className="patient-status">Active Patient</div>
                </div>
              </div>

              <div className="patient-details">
                <div className="patient-detail">
                  <span className="patient-detail-icon">📅</span>
                  Age: {patient.age} · {patient.gender}
                </div>
                <div className="patient-detail">
                  <span className="patient-detail-icon">🏥</span>
                  Diagnosis: {patient.diagnosis || 'Not specified'}
                </div>
                {patient.phone && (
                  <div className="patient-detail">
                    <span className="patient-detail-icon">📞</span>
                    {patient.phone}
                  </div>
                )}
                {patient.email && (
                  <div className="patient-detail">
                    <span className="patient-detail-icon">✉️</span>
                    {patient.email}
                  </div>
                )}
              </div>

              <div className="patient-actions">
                <button onClick={() => openEditModal(patient)} className="patient-action-btn edit-btn">
                  <span>✏️</span> Edit
                </button>
                <button onClick={() => navigate(`/patients/${patient._id}/records`)} className="patient-action-btn view-records-btn">
                  <span>📋</span> View Records
                </button>
                {(user?.role === 'admin' || user?.role === 'doctor') && (
                  <button onClick={() => openDeleteModal(patient)} className="patient-action-btn delete-btn">
                    <span>🗑️</span> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && patients.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Page <span style={{color: 'var(--primary-600)', fontWeight: '700'}}>{pagination.page}</span> of{" "}
            <span style={{color: 'var(--primary-600)', fontWeight: '700'}}>{pagination.pages}</span> ·{" "}
            {pagination.total} patients
          </div>
          <div className="pagination-controls">
            <button
              onClick={handlePrevPage}
              disabled={page <= 1}
              className="pagination-btn"
            >
              ← Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={page >= pagination.pages}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <PatientModal
        isOpen={isModalOpen}
        isEditMode={isEditMode}
        patientData={editingPatient}
        onClose={closeModal}
        onSubmit={isEditMode && activePatientId ? handleSubmit : handleAddPatient}
      />

      {isDeleteModalOpen && deleteTarget && (
        <div className="delete-modal-overlay" onClick={closeDeleteModal}>
          <div className="delete-modal">
            <div className="delete-modal-icon">⚠️</div>
            <h3>Delete Patient</h3>
            <p>
              Are you sure you want to delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong>?
              This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button onClick={closeDeleteModal} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleDelete} className="confirm-btn">
                Delete Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
