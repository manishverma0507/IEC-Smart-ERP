/**
 * Faculty-specific routes - MyIEC ERP
 * Gets faculty's own data and assigned courses
 */
const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const attendanceController = require('../controllers/attendanceController');
const examController = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

// All faculty routes require authentication and faculty role only (no admin/student)
router.use(protect);
router.use(authorize('faculty'));

// Faculty profile and data
router.get('/me', facultyController.getProfile);
router.get('/subjects', facultyController.getSubjects);
router.get('/students', facultyController.getStudents);
router.get('/attendance', facultyController.getAttendance);
router.get('/marks', facultyController.getMarks);
router.get('/timetable', facultyController.getTimetable);

// Faculty actions: mark attendance (subject-wise, date-wise)
router.post('/attendance', attendanceController.mark);
router.post('/attendance/bulk', attendanceController.bulkMark);

// Faculty actions: upload marks (subject-wise)
router.post('/marks', examController.createResult);

module.exports = router;
