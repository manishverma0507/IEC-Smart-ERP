const { User, AuditLog } = require('../models');
const { signToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id, user.role);

    try {
      await AuditLog.create({
        user: user._id,
        action: 'login',
        resource: 'auth',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    } catch (e) {
      console.warn('AuditLog skipped');
    }

    const dashboardUrl =
      user.role === 'admin'
        ? 'admin-dashboard.html'
        : user.role === 'faculty'
          ? 'faculty-dashboard.html'
          : 'student-dashboard.html';

    return res.json({
      success: true,
      data: {
        token,
        dashboardUrl,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error('GETME ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = { login, getMe };
