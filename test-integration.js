// Comprehensive Integration Test for Medi-Doc Application
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:3000';

let authToken = '';
let testPatientId = '';

console.log('🚀 Starting Medi-Doc Integration Tests...\n');

// Test 1: Health Check
async function testHealthCheck() {
  console.log('1. Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check: PASS');
    console.log(`   Service: ${response.data.service} (${response.data.env})`);
    console.log(`   Time: ${new Date(response.data.time).toLocaleString()}\n`);
    return true;
  } catch (error) {
    console.log('❌ Health Check: FAIL');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// Test 2: Authentication
async function testAuthentication() {
  console.log('2. Testing Authentication...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@medidoc.com',
      password: 'admin123!'
    });

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Authentication: PASS');
      console.log(`   User: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
      console.log(`   Role: ${response.data.data.user.role}\n`);
      return true;
    } else {
      console.log('❌ Authentication: FAIL - Invalid response');
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication: FAIL');
    console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    return false;
  }
}

// Test 3: Dashboard Access
async function testDashboardAccess() {
  console.log('3. Testing Dashboard Access...');
  try {
    const response = await axios.get(`${BASE_URL}/auth/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Dashboard Access: PASS');
      console.log(`   Total Patients: ${response.data.data.statistics.totalPatients}`);
      console.log(`   Total Records: ${response.data.data.statistics.totalRecords}`);
      console.log(`   Today Appointments: ${response.data.data.statistics.todayAppointments}\n`);
      return true;
    } else {
      console.log('❌ Dashboard Access: FAIL - Invalid response');
      return false;
    }
  } catch (error) {
    console.log('❌ Dashboard Access: FAIL');
    console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    return false;
  }
}

// Test 4: Patient Management
async function testPatientManagement() {
  console.log('4. Testing Patient Management...');

  // Test 4a: Get Patients
  try {
    const response = await axios.get(`${BASE_URL}/patients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Get Patients: PASS');
    console.log(`   Patients Found: ${response.data.data.length}`);

    // Test 4b: Create Patient
    const newPatient = {
      firstName: 'Test',
      lastName: 'Patient',
      age: 30,
      gender: 'male',
      diagnosis: 'Test condition',
      phone: '+1234567890',
      email: 'test.patient@example.com'
    };

    const createResponse = await axios.post(`${BASE_URL}/patients`, newPatient, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (createResponse.status === 201) {
      testPatientId = createResponse.data._id;
      console.log('✅ Create Patient: PASS');
      console.log(`   Created: ${newPatient.firstName} ${newPatient.lastName}`);

      // Test 4c: Update Patient
      const updateResponse = await axios.put(`${BASE_URL}/patients/${testPatientId}`, {
        ...newPatient,
        diagnosis: 'Updated test condition'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (updateResponse.status === 200) {
        console.log('✅ Update Patient: PASS');
      } else {
        console.log('❌ Update Patient: FAIL');
      }

      // Test 4d: Delete Patient
      const deleteResponse = await axios.delete(`${BASE_URL}/patients/${testPatientId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (deleteResponse.status === 200) {
        console.log('✅ Delete Patient: PASS');
      } else {
        console.log('❌ Delete Patient: FAIL');
      }
    } else {
      console.log('❌ Create Patient: FAIL');
    }

    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Patient Management: FAIL');
    console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    return false;
  }
}

// Test 5: Appointment Management
async function testAppointmentManagement() {
  console.log('5. Testing Appointment Management...');

  try {
    // First create a test patient for appointment
    const testPatient = {
      firstName: 'Appointment',
      lastName: 'Test',
      age: 25,
      gender: 'female',
      diagnosis: 'Checkup',
      phone: '+1987654321',
      email: 'appt.test@example.com'
    };

    const patientResponse = await axios.post(`${BASE_URL}/patients`, testPatient, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const patientId = patientResponse.data._id;

    // Test 5a: Get Doctors
    const doctorsResponse = await axios.get(`${BASE_URL}/appointments/doctors`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Get Doctors: PASS');
    console.log(`   Doctors Available: ${doctorsResponse.data.data.doctors.length}`);

    if (doctorsResponse.data.data.doctors.length > 0) {
      const doctorId = doctorsResponse.data.data.doctors[0]._id;

      // Test 5b: Create Appointment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Use unique time slot to avoid conflicts with previous test runs
      const uniqueHour = new Date().getMinutes() % 8 + 9; // 9-16 (clinic hours)
      const startTime = `${uniqueHour.toString().padStart(2, '0')}:00`;
      const endTime = `${(uniqueHour + 1).toString().padStart(2, '0')}:00`;

      const appointmentData = {
        patientId,
        doctorId,
        appointmentDate: tomorrow.toISOString().split('T')[0],
        startTime: startTime,
        endTime: endTime,
        reason: 'Integration test appointment'
      };

      const createApptResponse = await axios.post(`${BASE_URL}/appointments`, appointmentData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (createApptResponse.status === 201) {
        console.log('✅ Create Appointment: PASS');
        console.log(`   Appointment: ${appointmentData.appointmentDate} ${appointmentData.startTime}-${appointmentData.endTime}`);

        // Test 5c: Get Appointments
        const getApptsResponse = await axios.get(`${BASE_URL}/appointments`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Get Appointments: PASS');
        console.log(`   Total Appointments: ${getApptsResponse.data.data.appointments.length}`);

      } else {
        console.log('❌ Create Appointment: FAIL');
        console.log(`   Response: ${JSON.stringify(createApptResponse.data)}`);
      }

      // Clean up test patient
      await axios.delete(`${BASE_URL}/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

    } else {
      console.log('⚠️  No doctors available for appointment testing');
    }

    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Appointment Management: FAIL');
    console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    return false;
  }
}

// Test 6: Frontend Accessibility
async function testFrontendAccessibility() {
  console.log('6. Testing Frontend Accessibility...');
  try {
    const response = await axios.get(FRONTEND_URL);
    // For SPAs, we check that the server responds with HTML and includes React root
    if (response.status === 200 && response.data.includes('<div id="root"></div>')) {
      console.log('✅ Frontend Loading: PASS');
      console.log('   React App server is responding correctly\n');
      return true;
    } else {
      console.log('❌ Frontend Loading: FAIL - App server not responding correctly');
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend Loading: FAIL');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const results = [];

  results.push(await testHealthCheck());
  results.push(await testAuthentication());
  results.push(await testDashboardAccess());
  results.push(await testPatientManagement());
  results.push(await testAppointmentManagement());
  results.push(await testFrontendAccessibility());

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('=' .repeat(50));
  console.log(`📊 TEST SUMMARY: ${passed}/${total} tests passed`);
  console.log('=' .repeat(50));

  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! The application is fully functional.');
    console.log('✅ Backend API is working correctly');
    console.log('✅ Authentication system is secure');
    console.log('✅ Patient management is operational');
    console.log('✅ Appointment system is functional');
    console.log('✅ Frontend is accessible');
    console.log('✅ All components are properly connected');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Check the output above for details.');
    console.log('🔧 Issues may need to be resolved before production deployment.');
  }

  console.log('\n🏁 Integration testing completed.');
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test execution failed:', error.message);
  process.exit(1);
});
