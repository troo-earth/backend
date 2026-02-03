const express = require('express');
const { requirePermission } = require('../../middleware/rbacMiddleware');
const {
  inviteUserController,
  revokeInviteController,
  listMembersController,
  removeMemberController,
  revokePermissionsController,
} = require('./inviteController');

const router = express.Router();

// All routes here are protected (mounted after authMiddleware in server.js)
// Note: /join is mounted separately before auth in server.js
router.post('/invite', inviteUserController);
router.post('/revoke-invite', revokeInviteController);
router.post('/revoke-permissions', revokePermissionsController);
router.get('/members', requirePermission('USER_MANAGEMENT'), listMembersController);
router.delete('/members/:id', requirePermission('USER_MANAGEMENT'), removeMemberController);

module.exports = router;
