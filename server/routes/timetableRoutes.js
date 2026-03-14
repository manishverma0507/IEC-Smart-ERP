const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', timetableController.list);
router.get('/:id', timetableController.getOne);
router.post('/', authorize('admin'), timetableController.create);
router.put('/:id', authorize('admin'), timetableController.update);

module.exports = router;
