/**
 * Student-specific routes - MyIEC ERP
 * Gets student's own data with role-based filtering
 */
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// All student routes require authentication and student role only
router.use(protect);
router.use(authorize('student'));

// Student can only access their own data (identity from JWT)
router.get('/me', studentController.getProfile);
router.get('/attendance', studentController.getAttendance);
router.get('/notices', studentController.getNotices);
router.get('/marks', studentController.getMarks);
router.get('/fees', studentController.getFees);
router.get('/courses', studentController.getCourses);
router.get('/assignments', studentController.getAssignments);
router.get('/timetable', studentController.getTimetable);

module.exports = router;
