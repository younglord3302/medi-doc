import React, { useState } from 'react';

const HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

const getWeekDays = (baseDate = new Date()) => {
  // Start week on Monday
  const day = baseDate.getDay(); // 0 Sun, 1 Mon, ...
  const diffToMonday = (day + 6) % 7; // convert so Monday=0
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - diffToMonday);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
};

const sameDay = (dateA, dateB) => {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
};

const AppointmentsCalendar = ({ appointments }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState('all');

  // Filter appointments by selected doctor
  const filteredAppointments = selectedDoctor === 'all'
    ? appointments
    : appointments.filter(appt => appt.doctorId?._id === selectedDoctor);

  // Get unique doctors for filter
  const doctors = Array.from(
    new Set(
      appointments
        .map(appt => appt.doctorId)
        .filter(Boolean)
        .map(doctor => ({
          id: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          specialization: doctor.specialization || ''
        }))
    ),
    (doctor) => doctor.id
  );

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(new Date());
  };

  const getAppointmentsForSlot = (day, hour) => {
    return filteredAppointments.filter((appt) => {
      if (!appt.appointmentDate) return false;
      const apptDate = new Date(appt.appointmentDate);

      const matchesDay = sameDay(apptDate, day);
      const matchesHour = appt.startTime && appt.startTime.startsWith(hour);

      return matchesDay && matchesHour;
    });
  };

  const formatDayHeader = (date) =>
    date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });

  const formatWeekRange = () => {
    const days = getWeekDays(currentWeekStart);
    const start = days[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const end = days[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const statusClass = (status) => {
    if (status === 'cancelled') {
      return 'bg-rose-50 border-rose-200 text-rose-700';
    }
    if (status === 'completed') {
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    }
    if (status === 'confirmed') {
      return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    }
    if (status === 'in-progress') {
      return 'bg-purple-50 border-purple-200 text-purple-700';
    }
    if (status === 'no-show') {
      return 'bg-gray-50 border-gray-200 text-gray-700';
    }
    return 'bg-blue-50 border-blue-200 text-blue-700'; // scheduled / default
  };

  const days = getWeekDays(currentWeekStart);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-title-section">
          <h3 className="calendar-title">{formatWeekRange()}</h3>
          <p className="calendar-subtitle">
            Showing appointments by hour. Use filters to narrow results.
          </p>
        </div>

        <div className="calendar-controls">
          <div className="doctor-filter">
            <label>Filter by Doctor:</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="doctor-filter-select"
            >
              <option value="all">All Doctors</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                  {doctor.specialization && ` (${doctor.specialization})`}
                </option>
              ))}
            </select>
          </div>

          <div className="week-navigation">
            <button onClick={goToCurrentWeek} className="today-btn">
              Today
            </button>
            <button onClick={goToPreviousWeek} className="nav-btn" title="Previous week">
              ←
            </button>
            <button onClick={goToNextWeek} className="nav-btn" title="Next week">
              →
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Header row */}
        <div className="calendar-grid-header">
          <div className="time-column"></div>
          {days.map((d) => {
            const isToday = sameDay(d, new Date());
            return (
              <div
                key={d.toISOString()}
                className={`day-header ${isToday ? 'today' : ''}`}
              >
                {formatDayHeader(d)}
                {isToday && <div className="today-label">TODAY</div>}
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        {HOURS.map((hour) => (
          <div key={hour} className="calendar-row">
            {/* Time label */}
            <div className="time-label">{hour}</div>

            {/* Day × hour cells */}
            {days.map((day) => {
              const slotAppointments = getAppointmentsForSlot(day, hour);
              const isToday = sameDay(day, new Date());

              return (
                <div
                  key={day.toISOString() + hour}
                  className={`time-slot ${isToday ? 'today-slot' : ''}`}
                >
                  {slotAppointments.map((appt) => {
                    const patientName =
                      appt.patientId?.firstName && appt.patientId?.lastName
                        ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
                        : appt.patientName || 'Patient';

                    const doctorName =
                      appt.doctorId?.firstName && appt.doctorId?.lastName
                        ? `${appt.doctorId.firstName} ${appt.doctorId.lastName}`
                        : appt.doctorName || 'Doctor';

                    return (
                      <div
                        key={appt._id}
                        className={`appointment-item ${statusClass(appt.status)}`}
                        title={`${patientName} with ${doctorName}${appt.reason ? `: ${appt.reason}` : ''}`}
                      >
                        <div className="appointment-name">
                          {patientName}
                        </div>
                        <div className="appointment-doctor">
                          with {doctorName}
                        </div>
                        {appt.reason && (
                          <div className="appointment-reason">
                            {appt.reason}
                          </div>
                        )}
                        {appt.priority === 'urgent' && (
                          <div className="urgent-badge">
                            🚨 URGENT
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentsCalendar;
