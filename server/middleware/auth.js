const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { User, AuditLog } = require('../models');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied for this role' });
  }
  next();
};

const audit = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (req.user) {
      AuditLog.create({
        user: req.user._id,
        action,
        resource,
        resourceId: req.params.id || body?.data?._id,
        details: { method: req.method, path: req.path },
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }).catch(() => {});
    }
    return originalJson(body);
  };
  next();
};

module.exports = { protect, authorize, audit };
