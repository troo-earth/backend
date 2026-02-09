const crypto = require('crypto');
const Invitation = require('./invitationModel');
const Org = require('../org/orgModel');
const User = require('../user/userModel');
const { validateRoleAssignment } = require('../user/policies/roleGovernance');
const { sendEmail } = require('../emails/emailService');
const { invitationTemplate } = require('../emails/emailTemplates');
const { withLogging } = require('../../utils/logger');
const { destroyUserSessions } = require('../auth/policies/sessionInvalidation');

const sendInviteService = async ({
  actorUserId,
  actorRole,
  actorEmail,
  org_id,
  email,
  role,
}) => {

  const normalizedEmail = email.toLowerCase();

  await validateRoleAssignment({
    actorRole,
    targetRole: role,
    targetUserId: null,
    org_id,
    actorUserId,
  });

  // Prevent self invite
  if (normalizedEmail === actorEmail.toLowerCase()) {
    throw new Error('You cannot invite yourself');
  }

  // Prevent inviting existing org member
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser && existingUser.org_id === org_id) {
    throw new Error('User already belongs to this organization');
  }

  // Prevent duplicate pending invite
  const existingInvite = await Invitation.findOne({
    where: {
      org_id,
      email: normalizedEmail,
      status: 'pending',
    },
  });

  if (existingInvite) {
    throw new Error('Pending invitation already exists');
  }

  const invite_token = crypto.randomBytes(32).toString('hex');

  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 7);

  const invitation = await Invitation.create({
    org_id,
    email: normalizedEmail,
    role,
    invite_token,
    expires_at,
    created_by: actorUserId,
  });

  const org = await Org.findByPk(org_id);

  const inviteLink = `atlas.troo.earth/accept-invite?token=${invite_token}`;

  const html = invitationTemplate({
    invite_link: inviteLink,
    org_name: org.org_name,
    role,
  });

  await sendEmail({
    to: normalizedEmail,
    subject: `You have been invited to join ${org.org_name} on troo.earth`,
    html,
  });

  return invitation;
};

const acceptInvitationService = async ({ token, user_id }) => {

  const invitation = await Invitation.findOne({
    where: { invite_token: token },
  });

  if (!invitation) throw new Error('Invalid invitation token');

  if (invitation.status !== 'pending') {
    throw new Error('Invitation is no longer valid');
  }

  if (invitation.expires_at < new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    throw new Error('Invitation has expired');
  }

  const user = await User.findByPk(user_id);
  if (!user) throw new Error('User not found');

  // Ensure invite email matches account email
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error('Invitation email does not match logged-in user');
  }

  user.org_id = invitation.org_id;
  user.role = invitation.role;
  await user.save();

  invitation.status = 'accepted';
  await invitation.save();

  await destroyUserSessions(user_id);

  return { org_id: invitation.org_id, role: invitation.role };
};

const revokeInvitationService = async ({ email, org_id }) => {

  const invitation = await Invitation.findOne({
    where: {
      email: email.toLowerCase(),
      org_id,
      status: 'pending',
    },
  });

  if (!invitation) {
    throw new Error('Pending invitation not found');
  }

  invitation.status = 'revoked';
  await invitation.save();

  return invitation;
};

const listOrgInvitationsService = async ({ org_id, status }) => {

  const where = { org_id };
  if (status) where.status = status;

  const invitations = await Invitation.findAll({
    where,
    attributes: [
      'invite_id',
      'email',
      'role',
      'status',
      'created_by',
      'expires_at',
      'createdAt'
    ],
    order: [['createdAt', 'DESC']],
  });

  return invitations;
};

const resendInvitationService = async ({ email, org_id }) => {

  const invitation = await Invitation.findOne({
    where: {
      email: email.toLowerCase(),
      org_id,
      status: ['pending', 'expired'],
    },
    order: [['createdAt', 'DESC']],
  });

  if (!invitation) throw new Error('Invitation not found');

  if (invitation.status === 'accepted') {
    throw new Error('Invitation already accepted');
  }

  const invite_token = crypto.randomBytes(32).toString('hex');

  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 7);

  invitation.invite_token = invite_token;
  invitation.status = 'pending';
  invitation.expires_at = expires_at;
  await invitation.save();

  const org = await Org.findByPk(org_id);

  const inviteLink = `atlas.troo.earth/accept-invite?token=${invite_token}`;

  const html = invitationTemplate({
    invite_link: inviteLink,
    org_name: org.org_name,
    role: invitation.role,
  });

  await sendEmail({
    to: email,
    subject: `Reminder: Invitation to join ${org.org_name}`,
    html,
  });

  return invitation;
};

const checkInvitationTokenService = async ({ token }) => {

  if (!token) throw new Error('Invitation token is required');

  const invitation = await Invitation.findOne({
    where: { invite_token: token },
  });

  if (!invitation) throw new Error('Invalid invitation token');

  if (invitation.status !== 'pending') {
    throw new Error('Invitation is no longer valid');
  }

  if (invitation.expires_at < new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    throw new Error('Invitation has expired');
  }

  const existingUser = await User.findOne({
    where: { email: invitation.email },
    attributes: ['user_id'],
  });

  return {
    email: invitation.email,
    role: invitation.role,
    org_id: invitation.org_id,
    is_registered: !!existingUser,
  };
};

module.exports = {
  sendInviteService: withLogging(sendInviteService, 'sendInviteService'),
  acceptInvitationService: withLogging(acceptInvitationService, 'acceptInvitationService'),
  revokeInvitationService: withLogging(revokeInvitationService, 'revokeInvitationService'),
  listOrgInvitationsService: withLogging(listOrgInvitationsService, 'listOrgInvitationsService'),
  resendInvitationService: withLogging(resendInvitationService, 'resendInvitationService'),
  checkInvitationTokenService: withLogging(checkInvitationTokenService, 'checkInvitationTokenService'),
};
