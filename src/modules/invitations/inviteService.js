const { sendEmail } = require('../emails/emailService');
const { inviteTemplate, inviteTextTemplate } = require('../emails/emailTemplates');
const { Role, Invitation } = require('../../models/associations');
const User = require('../user/userModel');
const { createUserService } = require('../user/userService');
const { invalidatePermissionsCache } = require('../../middleware/rbacMiddleware');
const sessionManager = require('../../utils/sessionManager');
const sequelize = require('../../config/database');
const { validate: isValidUUID } = require('uuid');

const INVITE_EXPIRY_HOURS = parseInt(process.env.INVITE_EXPIRY_HOURS || '168', 10); // default 7 days
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || '';

// Note: we no longer generate or store per-invite tokens. We use the
// invitation's UUID (invite_id) as the identifier sent to the recipient.

async function createInvitation({ email, org_id, invited_by_user_id, role_name }) {
  const normalizedRoleName = typeof role_name === 'string' ? role_name.toUpperCase() : role_name;
  // lookup role_id by role_name using Sequelize
  const role = await Role.findOne({
    where: { role_name: normalizedRoleName }
  });

  if (!role) throw new Error('Unknown role');

  const role_id = role.role_id;

  const expires_at = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  // Create invitation using Sequelize
  const invitation = await Invitation.create({
    email,
    org_id,
    invited_by_user_id,
    role_id,
    expires_at,
    status: 'PENDING'
  });

  const data = invitation.toJSON ? invitation.toJSON() : invitation;

  // Send invite email (use centralized templates)
  const inviteId = data.invite_id;
  const joinUrl = `${FRONTEND_BASE_URL.replace(/\/$/, '')}/join-organization?invite_id=${inviteId}&org_id=${org_id}`;

  const html = inviteTemplate({ role_name, joinUrl, inviteId, org_id, expires_at });
  const text = inviteTextTemplate({ role_name, joinUrl, inviteId, org_id, expires_at });

  // In dev, log the generated email so we can verify content even if provider templates strip it
  if (process.env.NODE_ENV !== 'production') {
    console.log('Invite email HTML:', html);
    console.log('Invite email text:', text);
  }

  await sendEmail({ to: email, subject: 'Invitation to join troo.earth', html, text });

  return { invitation: data };
}

async function verifyInvitation({ invite_id, org_id, email }) {
  // Validate required identifier
  if (!invite_id) throw new Error('Missing invite identifier');
  
  // Validate UUID format to prevent database errors
  if (!isValidUUID(invite_id)) {
    throw new Error('Invalid invite identifier format');
  }
  
  if (org_id && !isValidUUID(org_id)) {
    throw new Error('Invalid organization identifier format');
  }

  // Look up by invite_id and pending status. If org_id is provided (from URL), validate it matches.
  const whereClause = {
    invite_id: invite_id,
    status: 'PENDING'
  };
  
  if (org_id) {
    whereClause.org_id = org_id;
  }

  const invitation = await Invitation.findOne({
    where: whereClause
  });

  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }

  const data = invitation.toJSON ? invitation.toJSON() : invitation;

  if (!data) throw new Error('Invalid or expired invitation');

  // check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new Error('Invitation expired');
  }

  if (email && data.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error('Invitation email mismatch');
  }

  // Try to enrich with role_name
  let role_name = null;
  try {
    const role = await Role.findByPk(data.role_id, {
      attributes: ['role_name']
    });
    if (role && role.role_name) {
      role_name = role.role_name;
    }
  } catch (e) {
    // ignore
  }

  return { ...data, role_name }; // contains role_id and invited_by_user_id and role_name
}

async function consumeInvitation({ invite_id }) {
  // Mark invitation as accepted - CRITICAL: must succeed to prevent reuse
  const [updatedRowsCount] = await Invitation.update(
    { 
      status: 'ACCEPTED',
      updatedAt: new Date()
    },
    {
      where: {
        invite_id: invite_id,
        status: 'PENDING'
      }
    }
  );

  // If no row was updated, treat as invalid/expired/already-used
  if (updatedRowsCount === 0) {
    console.error('Failed to update invitation status (possibly already used or invalid)');
    throw new Error('Invalid or expired invitation');
  }

  return true;
}

// Legacy function for backward compatibility - now calls the split functions
async function verifyAndConsumeInvitation({ invite_id, org_id, email }) {
  const invite = await verifyInvitation({ invite_id, org_id, email });
  await consumeInvitation({ invite_id });
  return invite;
}

async function revokeInvitation({ invite_id, revoked_by }) {
  if (!invite_id) throw new Error('Missing invite_id');

  // Update invitation using Sequelize
  const [updatedRowsCount, updatedInvitations] = await Invitation.update(
    { 
      status: 'REVOKED', 
      revoked_by, 
      revoked_at: new Date(),
      updatedAt: new Date()
    },
    {
      where: { invite_id },
      returning: true // Return updated records
    }
  );

  if (updatedRowsCount === 0) {
    throw new Error('Invitation not found');
  }

  // Return the updated invitation data
  const data = updatedInvitations[0].toJSON ? updatedInvitations[0].toJSON() : updatedInvitations[0];
  return data;
}

// Business logic for inviting a user
async function inviteUserService({ email, role_name, org_id, invited_by_user_id, inviter_role_name }) {
  // Validate required fields
  if (!email) {
    throw new Error('Email is required');
  }
  if (!role_name) {
    throw new Error('Role name is required');
  }
  if (!org_id) {
    throw new Error('User must belong to an organization to invite others');
  }
  if (!invited_by_user_id) {
    throw new Error('Inviter user ID is required');
  }

  const inviterRole = String(inviter_role_name).toUpperCase();
  const targetRole = String(role_name).toUpperCase();

  // Authorization: ADMIN can invite any; MANAGER can only invite VIEWER
  if (inviterRole === 'MANAGER' && targetRole !== 'VIEWER') {
    throw new Error('Managers may only invite VIEWERs');
  }
  if (inviterRole !== 'ADMIN' && inviterRole !== 'MANAGER') {
    throw new Error('Only ADMIN or MANAGER may invite users');
  }

  // Check if user already exists and belongs to another organization
  const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existingUser && existingUser.org_id) {
    if (existingUser.org_id === org_id) {
      throw new Error('User is already a member of this organization');
    } else {
      throw new Error('User already belongs to another organization');
    }
  }

  const { invitation } = await createInvitation({
    email,
    org_id,
    invited_by_user_id,
    role_name,
  });

  return { invitation };
}

// Business logic for joining an organization
// Uses a transaction to prevent race conditions: atomically consumes the invite
// before performing user operations. If any step fails, everything is rolled back.
async function joinOrganizationService({ invite_id, org_id, user_name, email, password, fullname }) {
  // First, verify the invitation without consuming (quick validation)
  const invite = await verifyInvitation({ invite_id, org_id, email });
  
  // Validate required fields for new users upfront (before transaction)
  const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!existingUser && (!user_name || !password || !fullname)) {
    throw new Error('Missing fields for new account creation');
  }

  // Use a transaction to ensure atomicity:
  // 1. Consume invitation (atomic PENDING→ACCEPTED with row lock)
  // 2. Create/update user
  // If anything fails, rollback both operations
  const transaction = await sequelize.transaction();
  
  try {
    // Atomically consume the invitation first (prevents race conditions)
    // Use row-level lock to prevent concurrent consumption
    const [updatedRowsCount] = await Invitation.update(
      { 
        status: 'ACCEPTED',
        updatedAt: new Date()
      },
      {
        where: {
          invite_id: invite_id,
          status: 'PENDING'  // Only update if still PENDING
        },
        transaction
      }
    );

    // If no rows updated, another request already consumed this invitation
    if (updatedRowsCount === 0) {
      throw new Error('Invalid or expired invitation');
    }

    let user;
    if (existingUser) {
      // User exists, just associate with org and assign role
      await User.update(
        {
          org_id: invite.org_id,
          role_id: invite.role_id,
        },
        { 
          where: { email: email.toLowerCase() },
          transaction
        }
      );
      
      user = await User.findOne({ 
        where: { email: email.toLowerCase() },
        transaction
      });
    } else {
      user = await createUserService({
        user_name,
        email,
        password,
        fullname,
        org_id: invite.org_id,
        role_id: invite.role_id,
        transaction,
        skipDuplicateChecks: true  // We already checked existingUser above
      });
    }

    // Commit the transaction - invitation consumed and user updated/created
    await transaction.commit();

    // Invalidate any active sessions for existing users so they pick up the new org/role context
    // This forces re-authentication to refresh session with updated RBAC data
    // Note: Done after commit so we don't invalidate sessions if the transaction fails
    if (existingUser) {
      try {
        await sessionManager.invalidateSessionsForUser(existingUser.user_id);
      } catch (e) {
        // Log but don't fail the join operation - user can manually re-login if needed
        console.error('Failed to invalidate sessions after org join', e.message || e);
      }
    }

    return { message: 'Successfully joined organization', user_id: user.user_id, role_name: invite.role_name };
  } catch (error) {
    // Rollback on any error - but only if transaction hasn't already been rolled back
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      // Transaction was already rolled back or finished, ignore
      console.error('Transaction rollback skipped (already finished):', rollbackError.message);
    }
    throw error;
  }
}

// Business logic for revoking an invitation
async function revokeInviteService({ invite_id, actor }) {
  // Fetch invitation to check ownership
  const inv = await Invitation.findOne({
    where: { invite_id }
  });
  
  if (!inv) throw new Error('Invitation not found');

  if (inv.org_id !== actor.org_id) {
    throw new Error('Invitation not found'); 
  }

  // Authorization
  if (actor.role_name === 'MANAGER' && inv.invited_by_user_id !== actor.user_id) {
    throw new Error('Managers can only revoke invites they created');
  }
  if (!['ADMIN', 'MANAGER'].includes(actor.role_name)) {
    throw new Error('Only ADMIN or MANAGER may revoke invites');
  }

  await revokeInvitation({ invite_id, revoked_by: actor.user_id });
  return { message: 'Invitation revoked' };
}

// Business logic for listing organization members
async function listMembersService({ org_id }) {
  // Fetch members with role information in a single query using JOIN
  const members = await User.findAll({ 
    where: { org_id }, 
    attributes: ['user_id', 'fullname', 'email', 'user_name', 'role_id', 'createdAt'],
    include: [{
      model: Role,
      as: 'role',
      attributes: ['role_name'],
      required: false // LEFT JOIN to include users without roles
    }]
  });

  // Transform the results to include role_name at the top level
  const enrichedMembers = members.map(member => {
    const memberData = member.toJSON ? member.toJSON() : member;
    return {
      ...memberData,
      role_name: memberData.role?.role_name || null,
      role: undefined // Remove nested role object
    };
  });

  return enrichedMembers;
}

// Business logic for removing a member from organization
async function removeMemberService({ targetUserId, actor }) {
  const target = await User.findByPk(targetUserId);
  if (!target) throw new Error('User not found');

  // Must be in same org
  if (target.org_id !== actor.org_id) throw new Error('User not in your organization');

  // Authorization: ADMIN can remove anyone in org; MANAGER can remove only users they invited
  if (actor.role_name === 'ADMIN') {
    // allowed
  } else if (actor.role_name === 'MANAGER') {
    // check Invitations table for who invited this user using Sequelize
    const invitation = await Invitation.findOne({
      where: {
        org_id: actor.org_id,
        email: target.email
      }
    });
    
    if (!invitation) throw new Error('Managers may only remove users they invited');
    if (invitation.invited_by_user_id !== actor.user_id) throw new Error('Managers may only remove users they invited');
  } else {
    throw new Error('Forbidden');
  }

  // Remove org association and role assignment
  await User.update(
    { 
      org_id: null, 
      role_id: null 
      // No longer storing role_name in Users table
    },
    { where: { user_id: targetUserId } }
  );

  // Force session invalidation for the removed user
  try {
    await sessionManager.invalidateSessionsForUser(targetUserId);
  } catch (e) {
    console.error('Failed to invalidate sessions for removed user', e.message || e);
  }

  return { message: 'Member removed from organization' };
}

// Business logic for changing user role/permissions
async function changeUserRoleService({ targetUserId, requestedRoleName, actor }) {
  const target = await User.findByPk(targetUserId);
  if (!target) throw new Error('User not found');

  // Must be in same org
  if (target.org_id !== actor.org_id) throw new Error('User not in your organization');

  const newRoleName = (requestedRoleName || 'VIEWER').toUpperCase();

  // Authorization: ADMIN can set any role; MANAGER may only set VIEWER
  if (actor.role_name === 'ADMIN') {
    // allowed
  } else if (actor.role_name === 'MANAGER') {
    if (newRoleName !== 'VIEWER') {
      throw new Error('Managers may only assign VIEWER role');
    }
    // additionally ensure the manager actually invited this user using Sequelize
    const invitation = await Invitation.findOne({
      where: {
        org_id: actor.org_id,
        email: target.email
      }
    });
    
    if (!invitation) throw new Error('Managers may only change roles for users they invited');
    if (invitation.invited_by_user_id !== actor.user_id) throw new Error('Managers may only change roles for users they invited');
  } else {
    throw new Error('Forbidden');
  }

  // Lookup requested role using Sequelize
  const newRole = await Role.findOne({
    where: { role_name: newRoleName }
  });
  
  if (!newRole) {
    throw new Error(`Role ${newRoleName} is not configured`);
  }

  const oldRoleId = target.role_id;
  
  // Update user role
  await User.update(
    { role_id: newRole.role_id },
    { where: { user_id: targetUserId } }
  );

  // Invalidate permissions cache for both old and new roles
  if (oldRoleId) {
    invalidatePermissionsCache(oldRoleId);
  }
  invalidatePermissionsCache(newRole.role_id);

  // Invalidate active sessions so the user picks up the new role immediately
  // Without this, the user would retain old permissions until re-login
  try {
    await sessionManager.invalidateSessionsForUser(targetUserId);
  } catch (e) {
    console.error('Failed to invalidate sessions after role change', e.message || e);
  }

  return { message: `User role updated to ${newRoleName}`, role_id: newRole.role_id };
}

module.exports = { 
  createInvitation, 
  verifyInvitation,
  consumeInvitation,
  verifyAndConsumeInvitation, // Legacy function for backward compatibility
  revokeInvitation,
  inviteUserService,
  joinOrganizationService,
  revokeInviteService,
  listMembersService,
  removeMemberService,
  changeUserRoleService
};
