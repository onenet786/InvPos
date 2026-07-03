const ROLE_HIERARCHY = {
  admin: 4,
  manager: 3,
  cashier: 2,
  inventory_staff: 2,
};

function checkRole(requiredRoles) {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoleName = req.userRole.name;
    const allowed = Array.isArray(requiredRoles)
      ? requiredRoles.includes(userRoleName)
      : userRoleName === requiredRoles;

    if (!allowed) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: userRoleName,
      });
    }

    next();
  };
}

function checkPermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const permissions = req.userRole.permissions || [];
    if (!permissions.includes(permission) && !permissions.includes('*')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required_permission: permission,
      });
    }

    next();
  };
}

module.exports = { checkRole, checkPermission, ROLE_HIERARCHY };
