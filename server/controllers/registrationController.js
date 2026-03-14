const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/jwt');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, rollNo, department, phone, avatar, status, semester, batch, designation, enrollmentNo, employeeId, subjects } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields: name, email, password, role' });
    }

    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be: student, faculty, or admin' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    if (rollNo) {
      const existingRollNo = await User.findOne({ rollNo });
      if (existingRollNo) {
        return res.status(400).json({ success: false, message: 'Roll number / Employee ID already exists' });
      }
    }

    if (role === 'student') {
      if (!semester || !batch) {
        return res.status(400).json({
          success: false,
          message: 'Students must have semester and batch year'
        });
      }
    }

    if (role === 'faculty') {
      if (!designation) {
        return res.status(400).json({
          success: false,
          message: 'Faculty members must have a designation'
        });
      }
    }

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role.toLowerCase(),
      rollNo: rollNo || null,
      enrollmentNo: enrollmentNo || null,
      employeeId: employeeId || null,
      department: department || null,
      phone: phone || null,
      avatar: avatar || null,
      isActive: status !== 'inactive' && status !== 'suspended',
      status: status || 'active'
    });

    if (role === 'student') {
      newUser.semester = parseInt(semester);
      newUser.batch = batch;
      newUser.enrollmentNo = enrollmentNo || rollNo;
      newUser.branch = department || newUser.branch;
    }

    if (role === 'faculty') {
      newUser.designation = designation;
      newUser.employeeId = employeeId || rollNo;
      if (subjects && Array.isArray(subjects)) {
        newUser.subjects = subjects;
      }
    }

    await newUser.save();

    res.status(201).json({
      success: true,
      message: `${name} registered successfully as ${role}`,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          rollNo: newUser.rollNo,
          department: newUser.department,
          isActive: newUser.isActive,
          semester: newUser.semester,
          batch: newUser.batch,
          designation: newUser.designation
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.validateRegistration = async (req, res) => {
  try {
    const { email, rollNo } = req.body;
    const errors = {};

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Invalid email format';
      } else {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          errors.email = 'Email already registered';
        }
      }
    }

    if (rollNo) {
      const existingRollNo = await User.findOne({ rollNo });
      if (existingRollNo) {
        errors.rollNo = 'Roll number / Employee ID already exists';
      }
    }

    res.json({
      success: Object.keys(errors).length === 0,
      errors: errors
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during validation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
