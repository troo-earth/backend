const express = require('express');
const { requirePermission } = require('../../middleware/rbacMiddleware');
const {
  inviteUserController,
  joinOrganizationController,
  revokeInviteController,
  listMembersController,
  removeMemberController,
  revokePermissionsController,
} = require('./inviteController');

const router = express.Router();

// Public join endpoint - invitees can accept invite and create/associate account
router.post('/join', joinOrganizationController);

router.post('/invite', inviteUserController);
router.post('/revoke-invite', revokeInviteController);
router.post('/revoke-permissions', revokePermissionsController);
router.get('/members', requirePermission('USER_MANAGEMENT'), listMembersController);
router.delete('/members/:id', requirePermission('USER_MANAGEMENT'), removeMemberController);

module.exports = router;
