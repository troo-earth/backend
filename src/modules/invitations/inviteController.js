const { 
  inviteUserService,
  joinOrganizationService,
  revokeInviteService,
  listMembersService,
  removeMemberService,
  changeUserRoleService
} = require('../invitations/inviteService');

async function inviteUserController(req, res, next) {
  try {
    const inviter = req.session?.user;
    if (!inviter) return res.error('Unauthenticated', 401);

    const { email, role_name } = req.body || {};
    const org_id = inviter.org_id;

    if (!email || !role_name) return res.error('Missing fields', 400);

    // Use service layer for business logic
    const { invitation } = await inviteUserService({
      email,
      role_name,
      org_id,
      invited_by_user_id: inviter.user_id,
      inviter_role_name: inviter.role_name
    });

  return res.success('Invitation sent', { invitation_id: invitation.invite_id });
  } catch (err) {
    if (err.message === 'Unknown role') return res.error(err.message, 400);
    if (err.message === 'Failed to create invitation') return res.error(err.message, 500);
    if (err.message === 'Managers may only invite VIEWERs') return res.error(err.message, 403);
    if (err.message === 'Only ADMIN or MANAGER may invite users') return res.error(err.message, 403);
    next(err);
  }
}

// Accept invite and create/associate user
async function joinOrganizationController(req, res, next) {
  try {
    const { invite_id, org_id, user_name, email, password, fullname } = req.body || {};
    if (!invite_id || !email) return res.error('Missing invite_id or email', 400);

    const { message, user_id } = await joinOrganizationService({ 
      invite_id, 
      org_id, 
      user_name, 
      email, 
      password, 
      fullname 
    });

    return res.success(message, { user_id });
  } catch (err) {
    // Map expected errors
    if (['Invalid or expired invitation', 'Invitation expired', 'Invitation email mismatch', 'Missing fields for new account creation'].includes(err.message)) {
      return res.error(err.message, 400);
    }
    next(err);
  }
}

// Revoke an existing invitation (admins can revoke any; managers only their own)
async function revokeInviteController(req, res, next) {
  try {
    const actor = req.session?.user;
    if (!actor) return res.error('Unauthenticated', 401);

    const { invite_id } = req.body || {};
    if (!invite_id) return res.error('Missing invite_id', 400);

    const { message } = await revokeInviteService({ invite_id, actor });

    return res.success(message, { invite_id });
  } catch (err) {
    if (err.message === 'Invitation not found') return res.error(err.message, 404);
    if (err.message === 'Managers can only revoke invites they created') return res.error(err.message, 403);
    if (err.message === 'Only ADMIN or MANAGER may revoke invites') return res.error(err.message, 403);
    next(err);
  }
}

// List members of the actor's org (ADMIN can view)
async function listMembersController(req, res, next) {
  try {
    const actor = req.session?.user;
    if (!actor) return res.error('Unauthenticated', 401);

    const org_id = actor.org_id;
    if (!org_id) return res.error('User is not associated with any organization', 403);

    const members = await listMembersService({ org_id });

    return res.success('Members fetched', members);
  } catch (err) {
    next(err);
  }
}

// Remove a member from the organization
async function removeMemberController(req, res, next) {
  try {
    const actor = req.session?.user;
    if (!actor) return res.error('Unauthenticated', 401);

    const { id: targetUserId } = req.params || {};
    if (!targetUserId) return res.error('Missing user id', 400);

    const { message } = await removeMemberService({ targetUserId, actor });

    return res.success(message, { user_id: targetUserId });
  } catch (err) {
    if (err.message === 'User not found') return res.error(err.message, 404);
    if (err.message === 'User not in your organization') return res.error(err.message, 403);
    if (err.message === 'Managers may only remove users they invited') return res.error(err.message, 403);
    if (err.message === 'Forbidden') return res.error(err.message, 403);
    next(err);
  }
}
// Revoke or change a user's role. Accepts optional `role_name` in the body (defaults to 'VIEWER').
// Authorization: ADMIN can set any role; MANAGER may only set VIEWER.
async function revokePermissionsController(req, res, next) {
  try {
    const actor = req.session?.user;
    if (!actor) return res.error('Unauthenticated', 401);

    const { user_id: targetUserId, role_name: requestedRoleName } = req.body || {};
    if (!targetUserId) return res.error('Missing user_id', 400);

    const { message, role_id } = await changeUserRoleService({ 
      targetUserId, 
      requestedRoleName, 
      actor 
    });

    return res.success(message, { user_id: targetUserId, role_id });
  } catch (err) {
    if (err.message === 'User not found') return res.error(err.message, 404);
    if (err.message === 'User not in your organization') return res.error(err.message, 403);
    if (err.message === 'Managers may only assign VIEWER role') return res.error(err.message, 403);
    if (err.message === 'Managers may only change roles for users they invited') return res.error(err.message, 403);
    if (err.message === 'Forbidden') return res.error(err.message, 403);
    if (err.message && err.message.includes('Role') && err.message.includes('is not configured')) return res.error(err.message, 400);
    next(err);
  }
}

module.exports = {
  inviteUserController,
  joinOrganizationController,
  revokeInviteController,
  listMembersController,
  removeMemberController,
  revokePermissionsController,
};
