import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AppointmentsCalendar from '../components/AppointmentsCalendar';
import './AppointmentsPage.css';

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [bookLoading, setBookLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bookError, setBookError] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    reason: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [appointmentsRes, patientsRes, doctorsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients'),
        api.get('/appointments/doctors'),
      ]);
      setAppointments(appointmentsRes.data.data?.appointments || []);
      setPatients(patientsRes.data.data || []); // Fixed: patients array is directly in data.data
      setDoctors(doctorsRes.data.data?.doctors || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    console.log('Opening booking modal');
    setBookError('');
    setForm({
      patientId: '',
      doctorId: user?.role === 'doctor' ? user._id : '',
      appointmentDate: '',
      startTime: '',
      endTime: '',
      reason: '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    console.log('Submitting appointment form with data:', form);
    setBookError('');

    if (
      !form.patientId ||
      !form.doctorId ||
      !form.appointmentDate ||
      !form.startTime ||
      !form.endTime
    ) {
      setBookError('Please fill in all required fields.');
      return;
    }

    try {
      setBookLoading(true);
      console.log('Sending API request to book appointment');
      await api.post('/appointments', form);
      console.log('Appointment booked successfully');
      setModalOpen(false);
      await fetchData();

      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      localStorage.setItem('dashboard-refresh', Date.now().toString());
    } catch (err) {
      console.error('Error booking appointment:', err);
      const msg =
        err.response?.data?.message ||
        'Failed to book appointment. Please check conflicts and try again.';
      setBookError(msg);
    } finally {
      setBookLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeRange = (start, end) => {
    if (!start || !end) return '-';
    return `${start} - ${end}`;
  };



  return (
    <div className="appointments-page">
      {/* Header Section */}
      <div className="appointments-header">
        <div className="appointments-header-content">
          <h1 className="appointments-title">Appointments</h1>
          <p className="appointments-subtitle">
            Manage bookings between patients and doctors. Conflicts are automatically prevented by the system.
          </p>
          <div className="appointments-actions">
            <div className="view-toggle">
              <button
                type="button"
                onClick={() => {
                  console.log('Switching to list view');
                  setViewMode('list');
                }}
                className={viewMode === 'list' ? 'active' : ''}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('Switching to calendar view');
                  setViewMode('calendar');
                }}
                className={viewMode === 'calendar' ? 'active' : ''}
              >
                Calendar
              </button>
            </div>
            <button onClick={openModal} className="book-appointment-btn">
              + Book Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="appointments-content">
        {error && (
          <div className="error-state">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Appointments Yet</h3>
            <p className="text-gray-500 mb-4">Get started by booking your first appointment.</p>
            <button onClick={openModal} className="submit-btn">
              Book First Appointment
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="appointments-list">
            {appointments.map((appt) => {
              const patientName =
                appt.patientId?.firstName && appt.patientId?.lastName
                  ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
                  : appt.patientName || 'Unknown patient';

              const doctorName =
                appt.doctorId?.firstName && appt.doctorId?.lastName
                  ? `${appt.doctorId.firstName} ${appt.doctorId.lastName}`
                  : appt.doctorName || 'Unknown doctor';

              const getStatusClass = (status) => {
                switch (status) {
                  case 'cancelled': return 'status-cancelled';
                  case 'completed': return 'status-completed';
                  case 'scheduled': return 'status-scheduled';
                  case 'confirmed': return 'status-confirmed';
                  case 'in-progress': return 'status-in-progress';
                  case 'no-show': return 'status-no-show';
                  default: return 'status-scheduled';
                }
              };

              return (
                <div key={appt._id} className="appointment-card">
                  <div className="appointment-header">
                    <div className="patient-info">
                      <div className="patient-avatar">
                        {patientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="patient-details">
                        <h3>{patientName}</h3>
                        <p>with {doctorName}</p>
                      </div>
                    </div>
                    <div className="appointment-meta">
                      <div className="meta-item">
                        <div className="meta-label">Date</div>
                        <div className="meta-value">{formatDate(appt.appointmentDate)}</div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Time</div>
                        <div className="meta-value">{formatTimeRange(appt.startTime, appt.endTime)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="appointment-body">
                    {appt.reason && (
                      <div className="appointment-reason">
                        <div className="reason-label">Reason for Visit</div>
                        <div className="reason-text">{appt.reason}</div>
                      </div>
                    )}
                    <div className={`appointment-status ${getStatusClass(appt.status)}`}>
                      <span className="status-icon">
                        {appt.status === 'completed' && '✅'}
                        {appt.status === 'cancelled' && '❌'}
                        {appt.status === 'confirmed' && '⏳'}
                        {appt.status === 'in-progress' && '🔄'}
                        {appt.status === 'scheduled' && '📅'}
                        {appt.status === 'no-show' && '🚫'}
                      </span>
                      {appt.status || 'scheduled'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="calendar-container">
            <AppointmentsCalendar appointments={appointments} />
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {modalOpen && (
        <div className="booking-modal-overlay">
          <div className="booking-modal">
            <div className="booking-modal-header">
              <h2 className="booking-modal-title">Book New Appointment</h2>
              <button onClick={closeModal} className="booking-modal-close">
                ×
              </button>
            </div>

            <div className="booking-modal-body">
              {bookError && (
                <div className="error-state">
                  {bookError}
                </div>
              )}

              <form onSubmit={handleBookAppointment} className="booking-form">
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select
                    name="patientId"
                    value={form.patientId}
                    onChange={handleFormChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select patient</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Doctor *</label>
                  <select
                    name="doctorId"
                    value={form.doctorId}
                    onChange={handleFormChange}
                    className="form-select"
                    required
                    disabled={user?.role === 'doctor'}
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.firstName} {d.lastName}{' '}
                        {d.specialization ? `(${d.specialization})` : ''}
                      </option>
                    ))}
                  </select>
                  {user?.role === 'doctor' && (
                    <p className="text-xs text-gray-500 mt-1">
                      You are booking as <strong>Dr. {user.lastName}</strong>.
                    </p>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      name="appointmentDate"
                      value={form.appointmentDate}
                      onChange={handleFormChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleFormChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason (optional)</label>
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleFormChange}
                    rows={3}
                    className="form-textarea"
                    placeholder="Regular checkup, follow-up, annual physical, etc."
                  />
                </div>
              </form>
            </div>

            <div className="booking-modal-footer">
              <button type="button" onClick={closeModal} className="cancel-btn">
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleBookAppointment}
                disabled={bookLoading}
                className="submit-btn"
              >
                {bookLoading ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
