const { PERMISSION_ROLES } = require('../constants/permissionRoles');

const authorizePermission = (permission) => {
  return (req, res, next) => {
    try {
      const userRole = req.session.user.role;

      const allowedRoles = PERMISSION_ROLES[permission];

      if (!allowedRoles) {
        console.error(`Permission not configured: ${permission}`);
        return res.error('Permission configuration error', 500);
      }

      if (!allowedRoles.includes(userRole)) {
        return res.error('Forbidden', 403);
      }

      next();
    } catch (err) {
      console.error('RBAC middleware error:', err);
      return res.error('Authorization error', 500);
    }
  };
};

module.exports = authorizePermission;
