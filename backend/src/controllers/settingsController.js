const Settings = require('../models/Settings');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');

exports.get = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne();
  if (!settings) {
    const created = await Settings.create();
    return res.json({ settings: created });
  }
  res.json({ settings });
});

exports.update = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create();
  }
  const oldValues = settings.toJSON();
  await settings.update(req.body);
  await logAudit(req, 'update', 'settings', settings.id, oldValues, req.body);
  res.json({ settings });
});
