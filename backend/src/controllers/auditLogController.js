const { AuditLog, User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

exports.list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  const { userId, action, entityType, dateFrom, dateTo } = req.query;

  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) where.createdAt[Op.lte] = new Date(dateTo + 'T23:59:59');
  }

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    limit,
    offset,
    include: [{ model: User, as: 'User' }],
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
