const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize, audit } = require('../middleware/auth');

// Public route for authenticated users to get their own profile
router.get('/me', protect, userController.getMe);

// Admin-only routes
router.use(protect);
router.use(authorize('admin'));

router.get('/', audit('list', 'user'), userController.list);
router.get('/:id', audit('view', 'user'), userController.getOne);
router.post('/', audit('create', 'user'), userController.create);
router.put('/:id', audit('update', 'user'), userController.update);
router.put('/:id/assign-subjects', audit('assign-subjects', 'user'), userController.assignSubjects);
router.delete('/:id', audit('delete', 'user'), userController.remove);

module.exports = router;
