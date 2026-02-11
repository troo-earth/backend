const { ROLES } = require('../../../constants/roles');
const User = require('../userModel');
const { withLogging } = require('../../../utils/logger');

const validateOrgMembershipChange = async ({
  actorRole,
  actorUserId,
  targetUserId,
  org_id,
}) => {

  if (actorUserId === targetUserId) {
    throw new Error('You cannot remove yourself from the organization');
  }

  const targetUser = await User.findByPk(targetUserId);
  if (!targetUser) {
    throw new Error('User not found');
  }

  if (targetUser.org_id !== org_id) {
    throw new Error('User does not belong to your organization');
  }

  // Admin cannot remove admin/superadmin
  if (
    actorRole === ROLES.ADMIN &&
    [ROLES.ADMIN, ROLES.SUPERADMIN].includes(targetUser.role)
  ) {
    throw new Error('Admins cannot remove admins or superadmins');
  }

  // Prevent last superadmin removal
  if (targetUser.role === ROLES.SUPERADMIN) {
    const superadminCount = await User.count({
      where: { org_id, role: ROLES.SUPERADMIN },
    });

    if (superadminCount <= 1) {
      throw new Error('Organization must have at least one superadmin');
    }
  }

  return targetUser;
};

module.exports = {
  validateOrgMembershipChange: withLogging(
    validateOrgMembershipChange,
    'validateOrgMembershipChange'
  ),
};
