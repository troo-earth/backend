const Invitation = require('../invitationModel');
const User = require('../../user/userModel');
const { withLogging } = require('../../../utils/logger');

const validateInviteCreation = async ({ email, org_id, actorEmail }) => {

  const normalizedEmail = email.toLowerCase();

  // Prevent self-invite
  if (normalizedEmail === actorEmail.toLowerCase()) {
    throw new Error('You cannot invite yourself');
  }

  // Prevent inviting existing org member
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });

  if (existingUser && existingUser.org_id === org_id) {
    throw new Error('User already belongs to this organization');
  }

  // Prevent duplicate pending invite
  const pendingInvite = await Invitation.findOne({
    where: {
      org_id,
      email: normalizedEmail,
      status: 'pending',
    },
  });

  if (pendingInvite) {
    throw new Error('A pending invitation already exists for this email');
  }
};

const validateInviteAcceptance = async ({ invitation, userEmail }) => {

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error('Invitation email does not match logged-in user');
  }

  if (invitation.status !== 'pending') {
    throw new Error('Invitation is no longer valid');
  }

  if (invitation.expires_at < new Date()) {
    throw new Error('Invitation has expired');
  }
};

module.exports = {
  validateInviteCreation: withLogging(validateInviteCreation, 'validateInviteCreation'),
  validateInviteAcceptance: withLogging(validateInviteAcceptance, 'validateInviteAcceptance'),
};
