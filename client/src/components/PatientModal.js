import React, { useState, useEffect } from 'react';
import '../pages/PatientsPage.css';

const PatientModal = ({ isOpen, onClose, onSubmit, isEditMode, patientData }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'male',
    phone: '',
    email: '',
    diagnosis: ''
  });

  // Update form when edit mode or patient data changes
  useEffect(() => {
    if (isEditMode && patientData) {
      setForm({
        firstName: patientData.firstName || '',
        lastName: patientData.lastName || '',
        age: patientData.age || '',
        gender: patientData.gender || 'male',
        phone: patientData.phone || '',
        email: patientData.email || '',
        diagnosis: patientData.diagnosis || ''
      });
    } else if (!isEditMode) {
      setForm({
        firstName: '',
        lastName: '',
        age: '',
        gender: 'male',
        phone: '',
        email: '',
        diagnosis: ''
      });
    }
  }, [isEditMode, patientData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(form);
      onClose();
      setForm({
        firstName: '',
        lastName: '',
        age: '',
        gender: 'male',
        phone: '',
        email: '',
        diagnosis: ''
      });
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
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600', color: '#2c3e50' }}>
          {isEditMode ? 'Edit Patient' : 'Add New Patient'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={form.firstName}
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
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={form.lastName}
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
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                Age *
              </label>
              <input
                type="number"
                name="age"
                required
                value={form.age}
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
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
                placeholder="Enter age"
                min="0"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                Gender *
              </label>
              <select
                name="gender"
                required
                value={form.gender}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #bdc3c7',
                  borderRadius: '6px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
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
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
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
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#7f8c8d', marginBottom: '0.25rem' }}>
              Diagnosis
            </label>
            <input
              type="text"
              name="diagnosis"
              value={form.diagnosis}
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
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#bdc3c7'}
              placeholder="Enter diagnosis if known"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="retry-btn"
              style={{ color: '#7f8c8d', backgroundColor: '#ecf0f1', border: '1px solid #bdc3c7', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: '500' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-patient-btn"
              style={{ color: 'white', backgroundColor: '#3498db', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: '500' }}
            >
              {isEditMode ? 'Save Changes' : 'Create Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModal;
