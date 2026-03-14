const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', attendanceController.list);
router.get('/stats', attendanceController.stats);
router.get('/defaulters', authorize('admin', 'faculty'), attendanceController.defaulters);
router.post('/mark', authorize('admin', 'faculty'), attendanceController.mark);
router.post('/bulk', authorize('admin', 'faculty'), attendanceController.bulkMark);

module.exports = router;
