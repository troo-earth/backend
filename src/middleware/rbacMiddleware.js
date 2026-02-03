const { Role, Permission } = require('../models/associations');

// In-memory cache for role permissions
// Structure: { role_id: { permissions: Set(['BUY', 'SELL', ...]), expires: timestamp } }
const rolePermissionsCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Fetch permissions for a role_id from cache or database
 * @param {string} roleId - The role ID to fetch permissions for
 * @returns {Promise<Set>} - Set of permission keys
 */
async function getRolePermissions(roleId) {
  const now = Date.now();
  const cached = rolePermissionsCache.get(roleId);
  
  // Return cached permissions if still valid
  if (cached && cached.expires > now) {
    return cached.permissions;
  }

  try {
    // Query Role with associated Permissions using Sequelize
    const role = await Role.findByPk(roleId, {
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['permission_key'],
        through: { attributes: [] } // Don't include junction table attributes
      }]
    });

    if (!role) {
      console.warn(`Role not found: ${roleId}`);
      return new Set();
    }

    const permissionKeys = (role.permissions || [])
      .map(permission => permission.permission_key)
      .filter(Boolean);

    const permissionSet = new Set(permissionKeys);
    
    // Cache the result with expiration
    rolePermissionsCache.set(roleId, {
      permissions: permissionSet,
      expires: now + CACHE_TTL
    });

    return permissionSet;
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    throw error;
  }
}

/**
 * Invalidate permissions cache for a specific role or all roles
 * Call this when role permissions are modified
 * @param {string} [roleId] - Optional specific role ID to invalidate
 */
function invalidatePermissionsCache(roleId = null) {
  if (roleId) {
    rolePermissionsCache.delete(roleId);
    console.log(`Invalidated permissions cache for role: ${roleId}`);
  } else {
    rolePermissionsCache.clear();
    console.log('Cleared entire permissions cache');
  }
}

/**
 * Middleware factory that requires a permission key (e.g. 'BUY', 'VIEW')
 * It expects req.session.user.role_id to be present.
 * Uses intelligent caching to minimize database queries.
 */
function requirePermission(permissionKey) {
  return async function (req, res, next) {
    try {
      const sessionUser = req.session?.user;
      if (!sessionUser || !sessionUser.role_id) {
        return res.error('Forbidden: missing role context', 403);
      }

      const roleId = sessionUser.role_id;

      // Get permissions from cache or database
      const rolePermissions = await getRolePermissions(roleId);

      if (rolePermissions.has(permissionKey)) {
        return next();
      }

      return res.error('Forbidden: insufficient permissions', 403);
    } catch (err) {
      console.error('RBAC middleware error', err);
      return res.error('Internal server error', 500);
    }
  };
}

// Optional: Clean up expired cache entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [roleId, cached] of rolePermissionsCache) {
    if (cached.expires <= now) {
      rolePermissionsCache.delete(roleId);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

module.exports = { 
  requirePermission, 
  invalidatePermissionsCache,
  getRolePermissions // Export for testing or manual cache warming
};
