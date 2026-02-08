const { sendInviteService, acceptInvitationService, revokeInvitationService } = require('./invitationService');
const { withLogging } = require('../../utils/logger');

const sendInviteController = async (req, res, next) => {
    try {
        const { email, role } = req.body;

        if (!email || !role) {
            return res.error('Email and Role are required', 400);
        }

        const actor = req.session.user;

        const invitation = await sendInviteService({
            actorUserId: actor.user_id,
            actorRole: actor.role,
            org_id: actor.org_id,
            email,
            role,
        });

        return res.success('Invitation sent successfully', invitation);

    } catch (error) {
        return res.error(error.message || 'Failed to send invite', 400);
    }
};

const acceptInvitationController = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.error('Invitation token required', 400);
        }

        const actor = req.session.user;

        const result = await acceptInvitationService({
            token,
            user_id: actor.user_id,
        });

        return res.success('Invitation accepted successfully', result);

    } catch (err) {
        return res.error(err.message, 400);
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
    return res.error(err.message, 400);
  }
};


module.exports = {
    sendInviteController: withLogging(sendInviteController, 'sendInviteController'),
    acceptInvitationController: withLogging(acceptInvitationController, 'acceptInvitationController'),
    revokeInvitationController: withLogging(revokeInvitationController, 'revokeInvitationController'),
};
