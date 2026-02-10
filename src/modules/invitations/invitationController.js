const {
  sendInviteService,
  acceptInvitationService,
  revokeInvitationService,
  listOrgInvitationsService,
  resendInvitationService,
  checkInvitationTokenService
} = require('./invitationService');

const { withLogging } = require('../../utils/logger');

const sendInviteController = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.error('Email and role are required', 400);

    const actor = req.session.user;

    const invitation = await sendInviteService({
      actorUserId: actor.user_id,
      actorRole: actor.role,
      actorEmail: actor.email,
      org_id: actor.org_id,
      email,
      role,
    });

    return res.success('Invitation sent successfully', invitation);

  } catch (error) {
    if (error.message) return res.error(error.message, 400);
    next(error);
  }
};

const resendInvitationController = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.error('Email is required', 400);

    const actor = req.session.user;

    const invitation = await resendInvitationService({
      email,
      org_id: actor.org_id,
    });

    return res.success('Invitation resent successfully', invitation);

  } catch (err) {
    if (err.message) return res.error(err.message, 400);
    next(err);
  }
};

const acceptInvitationController = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.error('Invitation token required', 400);

    const actor = req.session.user;

    const result = await acceptInvitationService({
      token,
      user_id: actor.user_id,
    });

    return res.success('Invitation accepted successfully', result);

  } catch (err) {
    if (err.message) return res.error(err.message, 400);
    next(err);
  }
};

const revokeInvitationController = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.error('Email is required', 400);
    }

    const actor = req.session.user;

    const invitation = await revokeInvitationService({
      email,
      org_id: actor.org_id,
    });

    return res.success('Invitation revoked successfully', invitation);

  } catch (err) {
    if (err.message) {
      return res.error(err.message, 400);
    }
    next(err);
  }
};

const listOrgInvitationsController = async (req, res, next) => {
  try {
    const actor = req.session.user;
    const { status } = req.query;

    const invitations = await listOrgInvitationsService({
      org_id: actor.org_id,
      status,
    });

    return res.success('Invitations fetched successfully', invitations);

  } catch (err) {
    if (err.message) {
      return res.error(err.message, 400);
    }
    next(err);
  }
};

const checkInvitationTokenController = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.error('token is required', 400);
    }

    const result = await checkInvitationTokenService({ token });

    return res.success('Invitation token verified', result);

  } catch (err) {
    if (err.message) {
      return res.error(err.message, 400);
    }
    next(err);
  }
};

module.exports = {
  sendInviteController: withLogging(sendInviteController, 'sendInviteController'),
  acceptInvitationController: withLogging(acceptInvitationController, 'acceptInvitationController'),
  revokeInvitationController: withLogging(revokeInvitationController, 'revokeInvitationController'),
  listOrgInvitationsController: withLogging(listOrgInvitationsController, 'listOrgInvitationsController'),
  resendInvitationController: withLogging(resendInvitationController, 'resendInvitationController'),
  checkInvitationTokenController: withLogging(checkInvitationTokenController, 'checkInvitationTokenController'),
};
