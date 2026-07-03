const jwt = require('jsonwebtoken');

function generateToken(userId, roleId) {
  return jwt.sign({ userId, roleId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

function generateResetToken(userId) {
  return jwt.sign({ userId, purpose: 'password_reset' }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '1h',
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
}

module.exports = { generateToken, generateResetToken, verifyToken };
