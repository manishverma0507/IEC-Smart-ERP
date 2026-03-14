const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const registrationController = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  sanitizeInput,
  checkDuplicateEmail,
  checkDuplicateRollNo
} = require('../middleware/validationMiddleware');

// Public routes
router.post('/login', sanitizeInput, validateLogin, authController.login);

// Registration (Admin only)
router.post(
  '/register',
  protect,
  authorize('admin'),
  sanitizeInput,
  validateRegistration,
  checkDuplicateEmail,
  checkDuplicateRollNo,
  registrationController.register
);

// Validation helper (no auth required)
router.post('/validate', registrationController.validateRegistration);

// Protected routes
router.get('/me', protect, authController.getMe);

module.exports = router;
