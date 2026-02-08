const { ROLES } = require('../../../constants/roles');
const User = require('../userModel');
const { withLogging } = require('../../../utils/logger');

const validateRoleAssignment = async ({
  actorRole,
  targetRole,
  targetUserId,
  org_id,
  actorUserId,
}) => {

  // 1. Admin cannot assign admin or superadmin
  if (actorRole === ROLES.ADMIN) {
    if (targetRole === ROLES.ADMIN || targetRole === ROLES.SUPERADMIN) {
      throw new Error('Admins cannot assign admin or superadmin roles');
    }
  }

  // 2. Only superadmin can manage admins
  if (
    (targetRole === ROLES.ADMIN || targetRole === ROLES.SUPERADMIN) &&
    actorRole !== ROLES.SUPERADMIN
  ) {
    throw new Error('Only superadmin can assign admin roles');
  }

  // 3. Prevent cross-org role modification
  if (targetUserId) {
    const targetUser = await User.findByPk(targetUserId);

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Ensure actor and target belong to same org
    if (targetUser.org_id !== org_id) {
      throw new Error('Cannot modify users outside your organization');
    }

    // Existing: Prevent last superadmin downgrade/remove
    if (
      targetUser.role === ROLES.SUPERADMIN &&
      targetRole !== ROLES.SUPERADMIN
    ) {
      const superadminCount = await User.count({
        where: {
          org_id,
          role: ROLES.SUPERADMIN,
        },
      });

      if (superadminCount <= 1) {
        throw new Error('Organization must have at least one superadmin');
      }
    }
  }

  // 4. Prevent self role escalation/demotion edge cases
  if (actorUserId === targetUserId && actorRole !== ROLES.SUPERADMIN) {
    throw new Error('Users cannot modify their own role');
  }
};

module.exports = {
  validateRoleAssignment: withLogging(validateRoleAssignment, 'validateRoleAssignment'),
};
