const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 15,
    max: 480 // Max 8 hours
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'emergency'],
    default: 'routine'
  },
  followUpForRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });

// Prevent double booking - compound unique index
appointmentSchema.index({
  doctorId: 1,
  appointmentDate: 1,
  startTime: 1,
  status: 1
}, {
  unique: true,
  partialFilterExpression: { status: { $in: ['scheduled', 'confirmed', 'in-progress'] } }
});

// Virtual for full appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function() {
  const [hours, minutes] = this.startTime.split(':');
  const dateTime = new Date(this.appointmentDate);
  dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return dateTime;
});

// Instance method to check if appointment conflicts - ATOMIC VERSION
appointmentSchema.methods.conflictsWith = async function(otherAppointmentId = null) {
  try {
    // Build query to check for conflicts
    const query = {
      doctorId: this.doctorId,
      appointmentDate: this.appointmentDate,
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
      $or: [
        {
          $and: [
            { startTime: { $lt: this.endTime } },
            { endTime: { $gt: this.startTime } }
          ]
        }
      ]
    };

    // Only exclude current appointment if updating (otherAppointmentId provided)
    if (otherAppointmentId) {
      query._id = { $ne: otherAppointmentId };
    }

    // Use atomic findOne to prevent race conditions
    const conflictingAppointment = await mongoose.model('Appointment').findOne(query).select('_id');

    return !!conflictingAppointment; // Return boolean
  } catch (error) {
    console.error('Conflict check error:', error);
    // Return true (assume conflict) to be safe
    return true;
  }
};

// Alternative: Use MongoDB transactions for appointment booking (more robust)
// Instance method with transaction-based booking
appointmentSchema.methods.bookWithTransaction = async function(session = null) {
  const sessionProvided = !!session;
  const currentSession = session || await mongoose.startSession();

  try {
    if (!sessionProvided) {
      currentSession.startTransaction();
    }

    // Check for conflicts within transaction
    const conflictingAppointment = await mongoose.model('Appointment').findOne({
      doctorId: this.doctorId,
      appointmentDate: this.appointmentDate,
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
      $or: [
        {
          $and: [
            { startTime: { $lt: this.endTime } },
            { endTime: { $gt: this.startTime } }
          ]
        }
      ]
    }, null, { session: currentSession }).select('_id');

    if (conflictingAppointment) {
      if (!sessionProvided) {
        await currentSession.abortTransaction();
        currentSession.endSession();
      }
      return { success: false, conflict: true };
    }

    // Save the appointment
    await this.save({ session: currentSession });

    if (!sessionProvided) {
      await currentSession.commitTransaction();
      currentSession.endSession();
    }

    return { success: true, appointment: this };

  } catch (error) {
    if (!sessionProvided) {
      await currentSession.abortTransaction();
      currentSession.endSession();
    }
    throw error;
  }
};

// Static method to get doctor's availability
appointmentSchema.statics.getDoctorAvailability = async function(doctorId, date) {
  const appointments = await this.find({
    doctorId,
    appointmentDate: date,
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
  }).sort('startTime');

  // Standard clinic hours: 9 AM - 5 PM (adjustable)
  const WORK_HOURS = {
    start: '09:00',
    end: '17:00'
  };

  const busySlots = appointments.map(app => ({
    start: app.startTime,
    end: app.endTime
  }));

  return {
    date,
    workHours: WORK_HOURS,
    busySlots,
    availableSlots: calculateAvailableSlots(WORK_HOURS, busySlots, 30) // 30-min slots
  };
};

// Helper function for available slots calculation
function calculateAvailableSlots(workHours, busySlots, slotDuration = 30) {
  const slots = [];
  const [startHour, startMinute] = workHours.start.split(':').map(Number);
  const [endHour, endMinute] = workHours.end.split(':').map(Number);

  const workStart = new Date();
  workStart.setHours(startHour, startMinute, 0, 0);

  const workEnd = new Date();
  workEnd.setHours(endHour, endMinute, 0, 0);

  let currentTime = new Date(workStart);

  while (currentTime < workEnd) {
    const slotStart = currentTime.toTimeString().slice(0, 5); // HH:MM format
    currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    const slotEnd = currentTime.toTimeString().slice(0, 5);

    // Check if slot conflicts with any busy slot
    const isAvailable = !busySlots.some(busy => {
      return (slotStart < busy.end && slotEnd > busy.start);
    });

    if (isAvailable && currentTime <= workEnd) {
      slots.push({
        start: slotStart,
        end: slotEnd,
        duration: slotDuration
      });
    }
  }

  return slots;
}

module.exports = mongoose.model('Appointment', appointmentSchema);
