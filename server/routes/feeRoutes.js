const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', feeController.list);
router.get('/risk', authorize('admin'), feeController.riskPrediction);
router.get('/:id', feeController.getOne);
router.post('/', authorize('admin'), feeController.create);
router.put('/:id', authorize('admin'), feeController.update);

module.exports = router;
