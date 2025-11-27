import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import MedicalRecordModal from '../components/MedicalRecordModal';
import PageLayout from '../components/PageLayout';
import ErrorBanner from '../components/ErrorBanner';
import './MedicalRecordsPage.css';



const MedicalRecordsPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchPatientAndRecords = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const [patientResponse, recordsResponse] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get(`/records/patient/${patientId}`, { params: { page } })
      ]);

      setPatient(patientResponse.data);
      setRecords(recordsResponse.data?.data || []);
      setPagination(recordsResponse.data?.pagination || null);
    } catch (err) {
      console.error('Error fetching patient records:', err);

      let errorMessage = 'Failed to load patient records';
      if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You may not have permission to view these records.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatientAndRecords(1);
  }, [fetchPatientAndRecords]);

  const handleNextPage = () => {
    if (pagination && pagination.page < pagination.pages) {
      fetchPatientAndRecords(pagination.page + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination && pagination.page > 1) {
      fetchPatientAndRecords(pagination.page - 1);
    }
  };

  const refreshCurrentPage = () => {
    if (pagination) fetchPatientAndRecords(pagination.page);
    else fetchPatientAndRecords(1);
  };

  const openCreateModal = () => {
    console.log('Opening create modal');
    setIsEditMode(false);
    setActiveRecordId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setIsEditMode(true);
    setActiveRecordId(record._id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setActiveRecordId(null);
  };

  const openDeleteModal = (record) => {
    setDeleteTarget(record);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setIsDeleteModalOpen(false);
  };

  const handleSubmit = async (recordData) => {
    try {
      if (isEditMode && activeRecordId) {
        await api.put(`/records/${activeRecordId}`, recordData);
      } else {
        await api.post('/records', { ...recordData, patientId });
      }
      await refreshCurrentPage();
      closeModal();
    } catch (err) {
      console.error('Error saving record:', err);
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await api.delete(`/records/${deleteTarget._id}`);
      closeDeleteModal();
      await refreshCurrentPage();
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete medical record. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="medical-records-page">
        <div className="loading">Loading medical records...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="medical-records-page">
        <div className="error">{error}</div>
        <button onClick={fetchPatientAndRecords} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <PageLayout
      title="Medical Records"
      subtitle={`Patient: ${patient?.firstName} ${patient?.lastName} · Age: ${patient?.age} · ${patient?.gender}`}
      actions={
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/patients')}
            className="rounded-lg border border-slate-300 text-slate-700 px-4 py-2 text-sm hover:bg-slate-50"
          >
            ← Back to Patients
          </button>
          <button
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            + Add Medical Record
          </button>
        </div>
      }
    >
      <ErrorBanner message={error} />

      {records.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No medical records found for this patient.</p>
          <p className="text-sm text-slate-500 mt-1">Click "Add Medical Record" to create the first record.</p>
        </div>
      ) : (
        <div className="records-list">
          {records.map((record) => (
            <div key={record._id} className="record-card">
              <div className="record-header">
                <h3>
                  {new Date(record.visitDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <div className="record-actions">
                  <button onClick={() => openEditModal(record)} className="edit-btn">Edit</button>
                  <button onClick={() => openDeleteModal(record)} className="delete-btn">Delete</button>
                </div>
              </div>

              <div className="record-content">
                <div className="section">
                  <h4>Diagnosis</h4>
                  <p><strong>Primary:</strong> {record.diagnosis?.primary || 'N/A'}</p>
                  {record.diagnosis?.secondary && record.diagnosis.secondary.length > 0 && (
                    <p><strong>Secondary:</strong> {record.diagnosis.secondary.join(', ')}</p>
                  )}
                </div>

                {record.symptoms && record.symptoms.length > 0 && (
                  <div className="section">
                    <h4>Symptoms</h4>
                    <p>{record.symptoms.join(', ')}</p>
                  </div>
                )}

                {record.vitalSigns && (
                  <div className="section">
                    <h4>Vital Signs</h4>
                    {record.vitalSigns.bloodPressure && <p>Blood Pressure: {record.vitalSigns.bloodPressure}</p>}
                    {record.vitalSigns.heartRate && <p>Heart Rate: {record.vitalSigns.heartRate} bpm</p>}
                    {record.vitalSigns.temperature && <p>Temperature: {record.vitalSigns.temperature}°F</p>}
                    {record.vitalSigns.weight && <p>Weight: {record.vitalSigns.weight} lbs</p>}
                    {record.vitalSigns.height && <p>Height: {record.vitalSigns.height} inches</p>}
                    {record.vitalSigns.bmi && <p>BMI: {record.vitalSigns.bmi}</p>}
                  </div>
                )}

                {record.medications && record.medications.length > 0 && (
                  <div className="section">
                    <h4>Medications</h4>
                    {record.medications.map((med, index) => (
                      <div key={index} className="medication">
                        <p><strong>{med.name}</strong> - {med.dosage}</p>
                        <p>Frequency: {med.frequency}</p>
                        {med.instructions && <p>Instructions: {med.instructions}</p>}
                        <p>Duration: {new Date(med.startDate).toLocaleDateString()} to {new Date(med.endDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}

                {record.labResults && record.labResults.length > 0 && (
                  <div className="section">
                    <h4>Lab Results</h4>
                    {record.labResults.map((lab, index) => (
                      <div key={index} className="lab-result">
                        <p><strong>{lab.testName}:</strong> {lab.value} {lab.unit}</p>
                        <p>Reference: {lab.referenceRange}</p>
                        <p>Date: {new Date(lab.date).toLocaleDateString()}</p>
                        {lab.notes && <p>Notes: {lab.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {record.treatmentPlan && (
                  <div className="section">
                    <h4>Treatment Plan</h4>
                    <p>{record.treatmentPlan.description}</p>
                    {record.treatmentPlan.procedures && record.treatmentPlan.procedures.length > 0 && (
                      <p><strong>Procedures:</strong> {record.treatmentPlan.procedures.join(', ')}</p>
                    )}
                    {record.treatmentPlan.followUpDate && (
                      <p><strong>Follow-up:</strong> {new Date(record.treatmentPlan.followUpDate).toLocaleDateString()}</p>
                    )}
                  </div>
                )}

                {record.notes && (
                  <div className="section">
                    <h4>Notes</h4>
                    <p>{record.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && records.length > 0 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-600">
          <p>
            Page <span className="font-medium">{pagination.page}</span> of{" "}
            <span className="font-medium">{pagination.pages}</span> ·{" "}
            {pagination.total} records
          </p>
          <div className="space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={pagination.page <= 1}
              className="px-3 py-1 rounded-md border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
            >
              Prev
            </button>
            <button
              onClick={handleNextPage}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 rounded-md border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <MedicalRecordModal
        isOpen={isModalOpen}
        isEditMode={isEditMode}
        recordData={isEditMode ? records.find(r => r._id === activeRecordId) : null}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50" onClick={closeDeleteModal}>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-3 text-red-600">Delete Medical Record</h3>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete this medical record from{' '}
              {new Date(deleteTarget.visitDate).toLocaleDateString()}?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={closeDeleteModal} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default MedicalRecordsPage;
