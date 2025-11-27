const request = require('supertest');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('./setupTestDB');
const app = require('../server');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Patient = require('../models/Patient');

async function createAndLoginUser(role = 'doctor') {
  const email = `${role}${Date.now()}@test.com`;

  const registerRes = await request(app).post('/api/auth/register').send({
    firstName: role,
    lastName: 'User',
    email,
    password: 'Password123!',
    role,
  });

  const loginRes = await request(app).post('/api/auth/login').send({
    email,
    password: 'Password123!',
  });

  return {
    token: loginRes.body.token,
    user: registerRes.body.data.user
  };
}

describe('Appointments API', () => {
  let doctorToken, testDoctor, testPatient;

  beforeAll(async () => {
    await connectTestDB();

    // Create test users and get tokens
    const doctorData = await createAndLoginUser('doctor');
    doctorToken = doctorData.token;
    testDoctor = doctorData.user;

    // Create test patient
    const patientRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        firstName: 'Test',
        lastName: 'Patient',
        age: 30,
        gender: 'male',
        diagnosis: 'Test condition'
      });

    testPatient = patientRes.body;
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('POST /api/appointments', () => {
  it('should create a new appointment successfully', async () => {
    const appointmentData = {
      patientId: testPatient._id,
      doctorId: testDoctor.id, // Use id instead of _id
      appointmentDate: '2025-12-01',
      startTime: '10:00',
      endTime: '10:30',
      reason: 'Regular check-up',
      priority: 'routine'
    };

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send(appointmentData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointment).toHaveProperty('_id');
  });

    it('should prevent double booking', async () => {
      const appointmentData = {
        patientId: testPatient._id,
        doctorId: testDoctor.id,
        appointmentDate: '2025-12-01',
        startTime: '10:00', // Same time as previous test
        endTime: '10:30',
        reason: 'Another appointment',
        priority: 'urgent'
      };

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(appointmentData);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already booked');
    });

    it('should validate required fields', async () => {
      const invalidAppointment = {
        patientId: testPatient._id,
        doctorId: testDoctor.id,
        appointmentDate: '2025-12-01'
        // Missing startTime, endTime, reason
      };

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidAppointment);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/appointments', () => {
    it('should get appointments list', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('appointments');
      expect(Array.isArray(res.body.data.appointments)).toBe(true);
    });
  });

  describe('GET /api/appointments/doctors', () => {
    it('should get available doctors', async () => {
      const res = await request(app)
        .get('/api/appointments/doctors')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.doctors)).toBe(true);
    });
  });
});
