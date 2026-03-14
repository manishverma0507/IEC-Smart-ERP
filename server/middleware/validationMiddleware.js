/**
 * Input Validation Middleware
 */

/**
 * Validate registration data
 */
exports.validateRegistration = (req, res, next) => {
  const { name, email, password, confirmPassword, role, rollNo, department, status } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 3) {
    errors.push('Name must be at least 3 characters');
  }

  if (name && name.length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.toLowerCase())) {
      errors.push('Invalid email format');
    }
  }

  // Password validation
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
  }

  // Confirm password validation
  if (!confirmPassword || confirmPassword !== password) {
    errors.push('Passwords do not match');
  }

  // Role validation
  if (!role || !['student', 'faculty', 'admin'].includes(role.toLowerCase())) {
    errors.push('Invalid role. Must be: student, faculty, or admin');
  }

  // Roll number validation
  if (!rollNo || rollNo.trim().length < 3) {
    errors.push('Roll number / Employee ID must be at least 3 characters');
  }

  if (rollNo && rollNo.length > 50) {
    errors.push('Roll number cannot exceed 50 characters');
  }

  // Department validation
  if (!department) {
    errors.push('Department is required');
  }

  const validDepartments = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'Admin'];
  if (department && !validDepartments.includes(department)) {
    errors.push(`Invalid department. Must be one of: ${validDepartments.join(', ')}`);
  }

  // Status validation
  if (status && !['active', 'inactive', 'suspended'].includes(status.toLowerCase())) {
    errors.push('Invalid status. Must be: active, inactive, or suspended');
  }

  // Role-specific validation
  if (role && role.toLowerCase() === 'student') {
    const { semester, batch } = req.body;
    if (!semester) {
      errors.push('Semester is required for students');
    }
    if (semester && (isNaN(semester) || semester < 1 || semester > 8)) {
      errors.push('Semester must be between 1 and 8');
    }
    if (!batch) {
      errors.push('Batch year is required for students');
    }
    if (batch && (isNaN(batch) || batch.length !== 4)) {
      errors.push('Batch must be a valid 4-digit year');
    }
  }

  if (role && role.toLowerCase() === 'faculty') {
    const { designation } = req.body;
    if (!designation) {
      errors.push('Designation is required for faculty members');
    }
    const validDesignations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];
    if (designation && !validDesignations.includes(designation)) {
      errors.push(`Invalid designation. Must be one of: ${validDesignations.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

/**
 * Validate email format
 */
exports.validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  next();
};

/**
 * Validate password strength
 */
exports.validatePassword = (req, res, next) => {
  const { password, confirmPassword } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required'
    });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
    });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  next();
};

/**
 * Sanitize user input
 */
exports.sanitizeInput = (req, res, next) => {
  const fieldsToSanitize = ['name', 'email', 'rollNo', 'department'];

  fieldsToSanitize.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      // Trim whitespace
      req.body[field] = req.body[field].trim();
      // Convert email to lowercase
      if (field === 'email') {
        req.body[field] = req.body[field].toLowerCase();
      }
    }
  });

  next();
};

/**
 * Validate login credentials
 */
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

/**
 * Validate user update
 */
exports.validateUserUpdate = (req, res, next) => {
  const { name, email, phone, department, status } = req.body;
  const errors = [];

  if (name && (name.trim().length < 3 || name.length > 100)) {
    errors.push('Name must be between 3 and 100 characters');
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.toLowerCase())) {
      errors.push('Invalid email format');
    }
  }

  if (phone && phone.length > 20) {
    errors.push('Phone number cannot exceed 20 characters');
  }

  if (department) {
    const validDepartments = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'Admin'];
    if (!validDepartments.includes(department)) {
      errors.push(`Invalid department. Must be one of: ${validDepartments.join(', ')}`);
    }
  }

  if (status && !['active', 'inactive', 'suspended'].includes(status.toLowerCase())) {
    errors.push('Invalid status. Must be: active, inactive, or suspended');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};

/**
 * Check for duplicate email
 */
exports.checkDuplicateEmail = async (req, res, next) => {
  const { email } = req.body;
  const User = require('../models/User');

  if (!email) return next();

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && (!req.params.id || existingUser._id.toString() !== req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking duplicate email'
    });
  }
};

/**
 * Check for duplicate roll number
 */
exports.checkDuplicateRollNo = async (req, res, next) => {
  const { rollNo } = req.body;
  const User = require('../models/User');

  if (!rollNo) return next();

  try {
    const existingUser = await User.findOne({ rollNo });
    if (existingUser && (!req.params.id || existingUser._id.toString() !== req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Roll number / Employee ID already exists'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking duplicate roll number'
    });
  }
};
