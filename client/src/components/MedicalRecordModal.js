import React, { useState, useEffect } from 'react';

const MedicalRecordModal = ({ isOpen, onClose, onSubmit, isEditMode, recordData }) => {
  const [form, setForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    diagnosis: { primary: '', secondary: [] },
    symptoms: [],
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: '',
      bmi: ''
    },
    medications: [],
    labResults: [],
    treatmentPlan: {
      description: '',
      procedures: [],
      followUpDate: ''
    },
    notes: ''
  });

  // Update form when edit mode or record data changes
  useEffect(() => {
    if (isEditMode && recordData) {
      setForm({
        visitDate: recordData.visitDate ? new Date(recordData.visitDate).toISOString().split('T')[0] : '',
        diagnosis: recordData.diagnosis || { primary: '', secondary: [] },
        symptoms: recordData.symptoms || [],
        vitalSigns: recordData.vitalSigns || {
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          weight: '',
          height: '',
          bmi: ''
        },
        medications: recordData.medications || [],
        labResults: recordData.labResults || [],
        treatmentPlan: recordData.treatmentPlan || {
          description: '',
          procedures: [],
          followUpDate: ''
        },
        notes: recordData.notes || ''
      });
    } else if (!isEditMode) {
      setForm({
        visitDate: new Date().toISOString().split('T')[0],
        diagnosis: { primary: '', secondary: [] },
        symptoms: [],
        vitalSigns: {
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          weight: '',
          height: '',
          bmi: ''
        },
        medications: [],
        labResults: [],
        treatmentPlan: {
          description: '',
          procedures: [],
          followUpDate: ''
        },
        notes: ''
      });
    }
  }, [isEditMode, recordData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested object fields
    if (name === 'primaryDiagnosis') {
      setForm(prev => ({
        ...prev,
        diagnosis: { ...prev.diagnosis, primary: value }
      }));
    } else if (name === 'secondaryDiagnosis') {
      const secondaryArray = value.split(',').map(s => s.trim()).filter(s => s);
      setForm(prev => ({
        ...prev,
        diagnosis: { ...prev.diagnosis, secondary: secondaryArray }
      }));
    } else if (name === 'symptoms') {
      const symptomsArray = value.split(',').map(s => s.trim()).filter(s => s);
      setForm(prev => ({ ...prev, symptoms: symptomsArray }));
    } else if (name.startsWith('vitalSigns.')) {
      const field = name.replace('vitalSigns.', '');
      setForm(prev => ({
        ...prev,
        vitalSigns: { ...prev.vitalSigns, [field]: value }
      }));
    } else if (name === 'treatmentDescription') {
      setForm(prev => ({
        ...prev,
        treatmentPlan: { ...prev.treatmentPlan, description: value }
      }));
    } else if (name === 'procedures') {
      const proceduresArray = value.split(',').map(p => p.trim()).filter(p => p);
      setForm(prev => ({
        ...prev,
        treatmentPlan: { ...prev.treatmentPlan, procedures: proceduresArray }
      }));
    } else if (name === 'followUpDate') {
      setForm(prev => ({
        ...prev,
        treatmentPlan: { ...prev.treatmentPlan, followUpDate: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(form);
      onClose();
      // Reset to default form (will reset when useEffect runs)
    } catch (error) {
      // Error handled by parent
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600', color: '#2c3e50' }}>
          {isEditMode ? 'Edit Medical Record' : 'Add Medical Record'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Visit Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
              Visit Date *
            </label>
            <input
              type="date"
              name="visitDate"
              required
              value={form.visitDate}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #bdc3c7',
                borderRadius: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
            />
          </div>

          {/* Diagnosis */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                Primary Diagnosis
              </label>
              <input
                type="text"
                name="primaryDiagnosis"
                value={form.diagnosis.primary}
                onChange={handleChange}
                placeholder="e.g., Hypertension"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #bdc3c7',
                  borderRadius: '6px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                Secondary Diagnosis
              </label>
              <input
                type="text"
                name="secondaryDiagnosis"
                value={form.diagnosis.secondary.join(', ')}
                onChange={handleChange}
                placeholder="comma separated"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #bdc3c7',
                  borderRadius: '6px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
              />
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
              Symptoms
            </label>
            <input
              type="text"
              name="symptoms"
              value={form.symptoms.join(', ')}
              onChange={handleChange}
              placeholder="comma separated, e.g., headache, fatigue, cough"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #bdc3c7',
                borderRadius: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
            />
          </div>

          {/* Vital Signs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                Blood Pressure
              </label>
              <input
                type="text"
                name="vitalSigns.bloodPressure"
                value={form.vitalSigns.bloodPressure}
                onChange={handleChange}
                placeholder="120/80"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #bdc3c7',
                  borderRadius: '6px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                Heart Rate
              </label>
              <input
                type="number"
                name="vitalSigns.heartRate"
                value={form.vitalSigns.heartRate}
                onChange={handleChange}
                placeholder="72"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #bdc3c7',
                  borderRadius: '6px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                name="vitalSigns.temperature"
                value={form.vitalSigns.temperature}
                onChange={handleChange}
                placeholder="98.6"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #bdc3c7',
                  borderRadius: '6px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
              />
            </div>
          </div>

          {/* Treatment Plan */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
              Treatment Plan
            </label>
            <textarea
              name="treatmentDescription"
              value={form.treatmentPlan.description}
              onChange={handleChange}
              placeholder="Describe the treatment plan and instructions"
              rows="3"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #bdc3c7',
                borderRadius: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Follow-up Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
              Follow-up Date
            </label>
            <input
              type="date"
              name="followUpDate"
              value={form.treatmentPlan.followUpDate ? new Date(form.treatmentPlan.followUpDate).toISOString().split('T')[0] : ''}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #bdc3c7',
                borderRadius: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional notes and observations"
              rows="3"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #bdc3c7',
                borderRadius: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Submit/Cancel Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                color: '#7f8c8d',
                backgroundColor: '#ecf0f1',
                border: '1px solid #bdc3c7',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                color: 'white',
                backgroundColor: '#17a2b8',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {isEditMode ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalRecordModal;
