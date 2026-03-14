const express = require('express');
const router = express.Router();
const userController = require('../controllers/userManagementController');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeInput, validateUserUpdate, checkDuplicateEmail } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(protect);

/**
 * User Management Routes (Admin only)
 */

// Get all users (with pagination and filters)
router.get('/', authorize('admin'), userController.getAllUsers);

// Get user statistics (Admin only)
router.get('/stats/summary', authorize('admin'), userController.getUserStats);

// Get single user
router.get('/:id', userController.getUser);

// Create new user (handled by auth/register)
router.post('/', authorize('admin'), sanitizeInput, userController.createUser);

// Update user
router.put('/:id', sanitizeInput, validateUserUpdate, checkDuplicateEmail, userController.updateUser);

// Delete user
router.delete('/:id', authorize('admin'), userController.deleteUser);

// Toggle user status
router.patch('/:id/status', authorize('admin'), userController.toggleUserStatus);

// Change password
router.post('/:id/change-password', userController.changePassword);

module.exports = router;
