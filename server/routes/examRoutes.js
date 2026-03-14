const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/results', examController.listResults);
router.get('/results/cgpa', examController.cgpaAnalysis);
router.post('/results', authorize('admin', 'faculty'), examController.createResult);
router.get('/schedule', examController.listExams);
router.post('/schedule', authorize('admin'), examController.createExam);

module.exports = router;
