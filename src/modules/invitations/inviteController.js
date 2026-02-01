const { createInvitation, verifyAndConsumeInvitation } = require('../invitations/inviteService');
const { revokeInvitation } = require('../invitations/inviteService');
const { createUserService } = require('../user/userService');
const { invalidatePermissionsCache } = require('../../middleware/rbacMiddleware');
const User = require('../user/userModel');
const supabase = require('../../config/supabase');
const sessionManager = require('../../utils/sessionManager');

async function inviteUserController(req, res, next) {
  try {
    const inviter = req.session?.user;
    if (!inviter) return res.error('Unauthenticated', 401);

    const { email, role_name } = req.body || {};
    const org_id = inviter.org_id;

    if (!email || !role_name) return res.error('Missing fields', 400);

    // Authorization: ADMIN can invite any; MANAGER can only invite VIEWER
    const inviterRole = inviter.role_name;
    if (inviterRole === 'MANAGER' && role_name !== 'VIEWER') {
      return res.error('Managers may only invite VIEWERs', 403);
    }
    if (inviterRole !== 'ADMIN' && inviterRole !== 'MANAGER') {
      return res.error('Only ADMIN or MANAGER may invite users', 403);
    }

    const { invitation } = await createInvitation({
      email,
      org_id,
      invited_by_user_id: inviter.user_id,
      role_name,
    });

  return res.success('Invitation sent', { invitation_id: invitation.invite_id });
  } catch (err) {
    if (err.message === 'Unknown role') return res.error(err.message, 400);
    if (err.message === 'Failed to create invitation') return res.error(err.message, 500);
    next(err);
  }
}

// Accept invite and create/associate user
async function joinOrganizationController(req, res, next) {
  try {
    const { invite_id, org_id, user_name, email, password, fullname } = req.body || {};
    if (!invite_id || !email) return res.error('Missing invite_id or email', 400);

    // verify invitation first - org_id is used for validation but we'll use invite.org_id for updates
    const invite = await verifyAndConsumeInvitation({ invite_id, org_id, email });
    
    // SECURITY: Use the verified org_id from the invitation, not from request body
    const verifiedOrgId = invite.org_id;

    // If user already exists, associate org and role
    const inviteEmail = (invite && invite.email) ? invite.email.toLowerCase() : null;
    const lookupEmail = (email || inviteEmail);
    const existing = lookupEmail ? await User.findOne({ where: { email: lookupEmail.toLowerCase() } }) : null;
    if (existing) {
      // update org and role using VERIFIED org_id from invitation
        await User.update({ 
          org_id: verifiedOrgId, 
          role_id: invite.role_id, 
          role_name: (invite.role_name || null) 
        }, { where: { user_id: existing.user_id } });

        // Invalidate permissions cache for the assigned role
        invalidatePermissionsCache(invite.role_id);

        // Invalidate any existing sessions for this user so their session reflects new org/role
        try {
          await sessionManager.invalidateSessionsForUser(existing.user_id);
        } catch (e) {
          console.error('Failed to invalidate sessions after joinOrganization for user', existing.user_id, e && e.message ? e.message : e);
        }

        return res.success('Invitation accepted. Account associated with organization', { user_id: existing.user_id });
    }

  // Create user (will send welcome email from createUserService)
  // Use the invite.email if caller didn't provide an email explicitly
  const createEmail = email || inviteEmail;
  if (!createEmail) return res.error('Missing email for new user', 400);
  const newUser = await createUserService({ user_name, email: createEmail, password, fullname });

    // Attach org and role to created user using VERIFIED org_id from invitation
    await User.update({ 
      org_id: verifiedOrgId, 
      role_id: invite.role_id, 
      role_name: (invite.role_name || null) 
    }, { where: { user_id: newUser.user_id } });

    // Invalidate permissions cache for the assigned role
    invalidatePermissionsCache(invite.role_id);

    return res.success('Account created and associated with organization', { user_id: newUser.user_id });
  } catch (err) {
    // Map expected errors
    if (['Invalid or expired invitation', 'Invitation expired', 'Invitation email mismatch'].includes(err.message)) {
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

    // Fetch invitation to check ownership
    const { data: inv, error } = await supabase.from('Invitations').select('*').eq('invite_id', invite_id).limit(1).single();
    if (error || !inv) return res.error('Invitation not found', 404);

    // Authorization
    if (actor.role_name === 'MANAGER' && inv.invited_by_user_id !== actor.user_id) {
      return res.error('Managers can only revoke invites they created', 403);
    }
    if (!['ADMIN', 'MANAGER'].includes(actor.role_name)) {
      return res.error('Only ADMIN or MANAGER may revoke invites', 403);
    }

    await revokeInvitation({ invite_id, revoked_by: actor.user_id });

    return res.success('Invitation revoked successfully', { invite_id });
  } catch (err) {
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

    const members = await User.findAll({ where: { org_id }, attributes: ['user_id', 'fullname', 'email', 'user_name', 'role_id', 'role_name', 'createdAt'] });

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

    const target = await User.findByPk(targetUserId);
    if (!target) return res.error('User not found', 404);

    // Must be in same org
    if (target.org_id !== actor.org_id) return res.error('User not in your organization', 403);

    // Authorization: ADMIN can remove anyone in org; MANAGER can remove only users they invited
    if (actor.role_name === 'ADMIN') {
      // allowed
    } else if (actor.role_name === 'MANAGER') {
      // check Invitations table for who invited this user
      const { data: invs, error } = await supabase.from('Invitations').select('*').eq('org_id', actor.org_id).eq('email', target.email).limit(1).single();
      if (error || !invs) return res.error('Managers may only remove users they invited', 403);
      if (invs.invited_by_user_id !== actor.user_id) return res.error('Managers may only remove users they invited', 403);
    } else {
      return res.error('Forbidden', 403);
    }

    // Soft-remove: clear org and role fields
    await User.update({ org_id: null, role_id: null, role_name: null }, { where: { user_id: targetUserId } });

    // Invalidate any active sessions for the removed user so they are forced to re-login
    try {
      await sessionManager.invalidateSessionsForUser(targetUserId);
    } catch (e) {
      console.error('Failed to invalidate sessions after removeMember for user', targetUserId, e && e.message ? e.message : e);
    }

    return res.success('Member removed from organization', { user_id: targetUserId });
  } catch (err) {
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

    const target = await User.findByPk(targetUserId);
    if (!target) return res.error('User not found', 404);

    if (target.org_id !== actor.org_id) return res.error('User not in your organization', 403);

    const newRoleName = (requestedRoleName || 'VIEWER').toUpperCase();

    // Authorization: ADMIN can set any role; MANAGER may only set VIEWER
    if (actor.role_name === 'ADMIN') {
      // allowed
    } else if (actor.role_name === 'MANAGER') {
      if (newRoleName !== 'VIEWER') {
        return res.error('Managers may only assign VIEWER role', 403);
      }
      // additionally ensure the manager actually invited this user
      const { data: inv, error } = await supabase.from('Invitations').select('*').eq('org_id', actor.org_id).eq('email', target.email).limit(1).single();
      if (error || !inv) return res.error('Managers may only change roles for users they invited', 403);
      if (inv.invited_by_user_id !== actor.user_id) return res.error('Managers may only change roles for users they invited', 403);
    } else {
      return res.error('Forbidden', 403);
    }

    // Lookup requested role in Supabase Roles table
    const { data: roles, error: roleErr } = await supabase.from('Roles').select('*').eq('role_name', newRoleName).limit(1);
    if (roleErr) {
      console.error('Failed to lookup role', roleErr);
      return res.error('Internal server error', 500);
    }
    if (!roles || roles.length === 0) {
      return res.error(`Role ${newRoleName} is not configured`, 400);
    }

    const newRole = roles[0];

    await User.update({ role_id: newRole.role_id, role_name: newRole.role_name }, { where: { user_id: targetUserId } });

    // Invalidate permissions cache for the old and new roles
    // Note: We invalidate for both old and new role_ids to be safe
    invalidatePermissionsCache(newRole.role_id);

    // Invalidate any active sessions for the target user so their new role is applied on next login
    try {
      await sessionManager.invalidateSessionsForUser(targetUserId);
    } catch (e) {
      console.error('Failed to invalidate sessions after role change for user', targetUserId, e && e.message ? e.message : e);
    }

    return res.success(`User role updated to ${newRole.role_name}`, { user_id: targetUserId, role_name: newRole.role_name });
  } catch (err) {
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
