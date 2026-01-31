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

const publicRouter = express.Router();
const protectedRouter = express.Router();

// Public join endpoint - invitees can accept invite and create/associate account
publicRouter.post('/join', joinOrganizationController);

// Protected invite endpoints (require auth via server mount)
// These routes will be mounted after the auth middleware in server.js
protectedRouter.post('/invite', inviteUserController);
protectedRouter.post('/revoke-invite', revokeInviteController);
protectedRouter.post('/revoke-permissions', revokePermissionsController);
protectedRouter.get('/members', requirePermission('USER_MANAGEMENT'), listMembersController);
protectedRouter.delete('/members/:id', requirePermission('USER_MANAGEMENT'), removeMemberController);

module.exports = { publicRouter, protectedRouter };
