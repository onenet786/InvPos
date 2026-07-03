const { User, Role, Branch, AuditLog } = require('../models');
const { hashPassword } = require('../utils/password');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');

exports.list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
    limit,
    offset,
    include: [{ model: Role, as: 'Role' }, { model: Branch, as: 'Branch' }],
    order: [['created_at', 'DESC']],
  });

  res.json({
    data: rows,
    pagination: {
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [{ model: Role, as: 'Role' }, { model: Branch, as: 'Branch' }],
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

exports.create = asyncHandler(async (req, res) => {
  const { username, email, password, roleId, branchId, firstName, lastName, phone } = req.body;

  if (!username || !email || !password || !roleId) {
    return res.status(400).json({ error: 'Username, email, password, and roleId are required' });
  }

  const existing = await User.findOne({ where: { username } });
  if (existing) return res.status(409).json({ error: 'Username already exists' });

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) return res.status(409).json({ error: 'Email already exists' });

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    username,
    email,
    passwordHash,
    roleId,
    branchId,
    firstName,
    lastName,
    phone,
  });

  await logAudit(req, 'create', 'user', user.id, null, req.body);

  const fullUser = await User.findByPk(user.id, {
    include: [{ model: Role, as: 'Role' }, { model: Branch, as: 'Branch' }],
  });
  res.status(201).json({ user: fullUser });
});

exports.update = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const oldValues = user.toJSON();
  const { firstName, lastName, phone, roleId, branchId, isActive, email } = req.body;

  let passwordHash;
  if (req.body.password) {
    passwordHash = await hashPassword(req.body.password);
  }

  await user.update({
    firstName: firstName !== undefined ? firstName : user.firstName,
    lastName: lastName !== undefined ? lastName : user.lastName,
    phone: phone !== undefined ? phone : user.phone,
    roleId: roleId !== undefined ? roleId : user.roleId,
    branchId: branchId !== undefined ? branchId : user.branchId,
    isActive: isActive !== undefined ? isActive : user.isActive,
    email: email !== undefined ? email : user.email,
    passwordHash: passwordHash || user.passwordHash,
  });

  await logAudit(req, 'update', 'user', user.id, oldValues, req.body);

  const updated = await User.findByPk(user.id, {
    include: [{ model: Role, as: 'Role' }, { model: Branch, as: 'Branch' }],
  });
  res.json({ user: updated });
});

exports.deactivate = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const oldValues = user.toJSON();
  await user.update({ isActive: false });

  await logAudit(req, 'deactivate', 'user', user.id, oldValues, { isActive: false });
  res.json({ message: 'User deactivated' });
});

exports.getActivity = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const { count, rows } = await AuditLog.findAndCountAll({
    where: { userId: req.params.id },
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  res.json({
    data: rows,
    pagination: {
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  });
});
