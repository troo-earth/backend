const supabase = require('../config/supabase');

/**
 * Middleware factory that requires a permission key (e.g. 'BUY', 'VIEW')
 * It expects req.session.user.role_id to be present.
 */
function requirePermission(permissionKey) {
  return async function (req, res, next) {
    try {
      const sessionUser = req.session?.user;
      if (!sessionUser || !sessionUser.role_id) {
        return res.error('Forbidden: missing role context', 403);
      }

      const roleId = sessionUser.role_id;

      // Query RolePermissions -> Permissions for this role
      // We join RolePermissions and Permissions to find a matching permission_key
      const { data, error } = await supabase
        .from('RolePermissions')
        .select('permission:permission_id(permission_key)')
        .eq('role_id', roleId);

      if (error) {
        console.error('RBAC supabase error', error);
        return res.error('Internal server error', 500);
      }

      const permissionKeys = (data || [])
        .map(rp => rp.permission?.permission_key)
        .filter(Boolean);

      if (permissionKeys.includes(permissionKey)) {
        return next();
      }

      return res.error('Forbidden: insufficient permissions', 403);
    } catch (err) {
      console.error('RBAC middleware error', err);
      return res.error('Internal server error', 500);
    }
  };
}

module.exports = { requirePermission };
