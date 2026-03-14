const jwt = require('jsonwebtoken');
const config = require('../config/env');

const signToken = (id, role) =>
  jwt.sign({ id, role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRE });

const signRefreshToken = (id) =>
  jwt.sign({ id }, config.JWT_REFRESH_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRE });

const verifyToken = (token) => jwt.verify(token, config.JWT_SECRET);

module.exports = { signToken, signRefreshToken, verifyToken };
