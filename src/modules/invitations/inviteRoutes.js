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

// Public router for unauthenticated endpoints
const publicRouter = express.Router();

// Public join endpoint - invitees can accept invite and create/associate account
publicRouter.post('/join', joinOrganizationController);

// Authenticated router for endpoints requiring authentication
const authenticatedRouter = express.Router();

authenticatedRouter.post('/invite', inviteUserController);
authenticatedRouter.post('/revoke-invite', revokeInviteController);
authenticatedRouter.post('/revoke-permissions', revokePermissionsController);
authenticatedRouter.get('/members', requirePermission('USER_MANAGEMENT'), listMembersController);
authenticatedRouter.delete('/members/:id', requirePermission('USER_MANAGEMENT'), removeMemberController);

module.exports = {
  publicInviteRoutes: publicRouter,
  authenticatedInviteRoutes: authenticatedRouter,
};
