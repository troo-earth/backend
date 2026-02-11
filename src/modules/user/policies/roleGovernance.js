const { ROLES } = require('../../../constants/roles');
const User = require('../userModel');
const { withLogging } = require('../../../utils/logger');

const validateRoleAssignment = async ({
  actorRole,
  targetRole,
  actorUserId,
  targetUserId,
  org_id,
}) => {

  // Only superadmin can assign admin/superadmin
  if (
    [ROLES.ADMIN, ROLES.SUPERADMIN].includes(targetRole) &&
    actorRole !== ROLES.SUPERADMIN
  ) {
    throw new Error('Only superadmins can assign admin or superadmin roles');
  }

  if (!targetUserId) return; // invitations stop here

  const targetUser = await User.findByPk(targetUserId);
  if (!targetUser) {
    throw new Error('Target user not found');
  }

  if (targetUser.org_id !== org_id) {
    throw new Error('Cannot modify users outside your organization');
  }

  // Prevent self-role modification
  if (actorUserId === targetUserId && actorRole !== ROLES.SUPERADMIN) {
    throw new Error('Users cannot modify their own role');
  }

  // Prevent last superadmin downgrade
  if (
    targetUser.role === ROLES.SUPERADMIN &&
    targetRole !== ROLES.SUPERADMIN
  ) {
    const superadminCount = await User.count({
      where: { org_id, role: ROLES.SUPERADMIN },
    });

    if (superadminCount <= 1) {
      throw new Error('Organization must have at least one superadmin');
    }
  }
};

module.exports = {
  validateRoleAssignment: withLogging(
    validateRoleAssignment,
    'validateRoleAssignment'
  ),
};
