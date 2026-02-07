const { Role, Permission } = require('../models/associations');
const redisClient = require('../config/redis');

// Redis cache key prefixes
const PERMISSIONS_CACHE_PREFIX = 'rbac:permissions:';
const ROLE_NAME_CACHE_PREFIX = 'rbac:role_name:';
const CACHE_TTL_SECONDS = 15 * 60; // 15 minutes

/**
 * Fetch permissions for a role_id from Redis cache or database
 * @param {string} roleId - The role ID to fetch permissions for
 * @returns {Promise<Set>} - Set of permission keys
 */
async function getRolePermissions(roleId) {
  const cacheKey = `${PERMISSIONS_CACHE_PREFIX}${roleId}`;
  
  try {
    // Try to get from Redis cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const permissionKeys = JSON.parse(cached);
      return new Set(permissionKeys);
    }
  } catch (cacheError) {
    // Log but don't fail - fall through to database query
    console.error('Redis cache read error:', cacheError.message);
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
    
    // Cache the result in Redis with TTL
    try {
      await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(permissionKeys));
    } catch (cacheError) {
      // Log but don't fail the request
      console.error('Redis cache write error:', cacheError.message);
    }

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
async function invalidatePermissionsCache(roleId = null) {
  try {
    if (roleId) {
      const cacheKey = `${PERMISSIONS_CACHE_PREFIX}${roleId}`;
      await redisClient.del(cacheKey);
      console.log(`Invalidated permissions cache for role: ${roleId}`);
    } else {
      // Delete all keys matching the prefix pattern
      const keys = await redisClient.keys(`${PERMISSIONS_CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      console.log('Cleared entire permissions cache');
    }
  } catch (error) {
    console.error('Error invalidating permissions cache:', error.message);
    // Don't throw - cache invalidation failure shouldn't break the app
  }
}

/**
 * Get role name from cache or database
 * @param {string} roleId - The role ID
 * @returns {Promise<string|null>} - The role name or null
 */
async function getRoleName(roleId) {
  if (!roleId) return null;
  
  const cacheKey = `${ROLE_NAME_CACHE_PREFIX}${roleId}`;
  
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (cacheError) {
    console.error('Redis cache read error (role name):', cacheError.message);
  }

  try {
    const role = await Role.findByPk(roleId, {
      attributes: ['role_name']
    });

    if (!role) {
      return null;
    }

    const roleName = role.role_name;
    
    // Cache the result
    try {
      await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, roleName);
    } catch (cacheError) {
      console.error('Redis cache write error (role name):', cacheError.message);
    }

    return roleName;
  } catch (error) {
    console.error('Error fetching role name:', error.message);
    return null;
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


module.exports = { 
  requirePermission, 
  invalidatePermissionsCache,
  getRolePermissions,
  getRoleName
};
