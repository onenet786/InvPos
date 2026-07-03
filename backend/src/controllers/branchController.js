const { Branch } = require('../models');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');

exports.list = asyncHandler(async (req, res) => {
  const branches = await Branch.findAll({ order: [['name', 'ASC']] });
  res.json({ data: branches });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, code, address, phone, email, isHeadquarters } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });

  const existing = await Branch.findOne({ where: { code } });
  if (existing) return res.status(409).json({ error: 'Branch code already exists' });

  const branch = await Branch.create({ name, code, address, phone, email, isHeadquarters });
  await logAudit(req, 'create', 'branch', branch.id, null, req.body);
  res.status(201).json({ branch });
});

exports.update = asyncHandler(async (req, res) => {
  const branch = await Branch.findByPk(req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  const oldValues = branch.toJSON();
  await branch.update(req.body);
  await logAudit(req, 'update', 'branch', branch.id, oldValues, req.body);
  res.json({ branch });
});
