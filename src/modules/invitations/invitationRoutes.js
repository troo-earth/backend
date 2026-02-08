const express = require('express');
const router = express.Router();

const { sendInviteController,acceptInvitationController, revokeInvitationController } = require('./invitationController');
const authorizePermission = require('../../middleware/authorizePermission');
const { PERMISSIONS } = require('../../constants/permissions');

// Send invite
router.post('/create-invite', authorizePermission(PERMISSIONS.INVITE_USER), sendInviteController);

router.post('/accept-invite', acceptInvitationController);

router.patch('/revoke-invite',authorizePermission(PERMISSIONS.INVITE_USER), revokeInvitationController);

module.exports = router;
