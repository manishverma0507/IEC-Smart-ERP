const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', noticeController.list);
router.get('/:id', noticeController.getOne);
router.post('/', authorize('admin', 'faculty'), noticeController.create);
router.put('/:id', authorize('admin', 'faculty'), noticeController.update);

module.exports = router;
