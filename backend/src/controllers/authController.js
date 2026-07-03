const { User, Role, Branch } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken, generateResetToken, verifyToken } = require('../utils/jwt');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = await User.scope('withPassword').findOne({
    where: { username },
    include: [{ model: Role, as: 'Role' }, { model: Branch, as: 'Branch' }],
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  await user.update({ lastLogin: new Date() });

  const token = generateToken(user.id, user.roleId);

  await logAudit(req, 'login', 'user', user.id, null, { username: user.username });

  const userData = user.toJSON();
  delete userData.passwordHash;

  res.json({
    token,
    user: userData,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  await logAudit(req, 'logout', 'user', req.user.id, null, null);
  res.json({ message: 'Logged out successfully' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [{ model: Role, as: 'Role' }, { model: Branch, as: 'Branch' }],
  });
  res.json({ user });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.json({ message: 'If the email exists, a reset link has been sent' });
  }

  const resetToken = generateResetToken(user.id);
  await user.update({
    passwordResetToken: resetToken,
    passwordResetExpires: new Date(Date.now() + 3600000),
  });

  await logAudit(req, 'forgot_password', 'user', user.id, null, null);

  res.json({
    message: 'If the email exists, a reset link has been sent',
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const user = await User.findByPk(decoded.userId);
  if (!user || user.passwordResetToken !== token || new Date() > user.passwordResetExpires) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const hashed = await hashPassword(password);
  await user.update({
    passwordHash: hashed,
    passwordResetToken: null,
    passwordResetExpires: null,
  });

  await logAudit(req, 'reset_password', 'user', user.id, null, null);

  res.json({ message: 'Password reset successfully' });
});
