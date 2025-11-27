const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');
const router = express.Router();

// Protect all patient routes
router.use(protect);
router.use(requireRole("admin", "doctor", "nurse", "receptionist"));

// Patient routes
router.post('/', createPatient);     // CREATE patient
router.get('/', getPatients);        // READ all patients (with pagination)
router.get('/:id', getPatient);      // READ single patient
router.put('/:id', updatePatient);   // UPDATE patient
router.delete('/:id', deletePatient); // DELETE patient

module.exports = router;
