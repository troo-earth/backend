const OrgUser = require('./orgUserModel');
const User = require('../user/userModel');


async function inviteMember({ org_id, email }) {
  if (!org_id || !email) throw new Error('org_id and email are required');

   
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    const alreadyLinked = await OrgUser.findOne({
      where: { org_id, user_id: existingUser.user_id },
    });
    if (alreadyLinked) throw new Error('User already part of this organization');

    const link = await OrgUser.create({
      org_id,
      user_id: existingUser.user_id,
      email: existingUser.email, 
      role: null, 
    });

    return {
      mode: 'linked_existing_user',
      org_user_id: link.org_user_id,
      user_id: existingUser.user_id,
      email: existingUser.email,
      pending: false,
    };
  }

  
  const existingPending = await OrgUser.findOne({
    where: { org_id, email },
  });
  if (existingPending) throw new Error('Invite already exists for this email');

  const pending = await OrgUser.create({
    org_id,
    user_id: null,
    email,
    role: null,
  });

  return {
    mode: 'pending_invite',
    org_user_id: pending.org_user_id,
    user_id: null,
    email,
    pending: true,
  };
}


async function viewMembers(org_id) {
  if (!org_id) throw new Error('org_id is required');

  const rows = await OrgUser.findAll({ where: { org_id } });

 
  const userIds = rows.filter(r => r.user_id).map(r => r.user_id);
  const usersById = {};
  if (userIds.length) {
    const users = await User.findAll({
      where: { user_id: userIds },
      attributes: ['user_id', 'user_name', 'email'],
    });
    users.forEach(u => { usersById[u.user_id] = u; });
  }

  return rows.map(r => ({
    org_user_id: r.org_user_id,
    org_id: r.org_id,
    user_id: r.user_id,
    email: r.user_id ? usersById[r.user_id]?.email || r.email : r.email,
    user_name: r.user_id ? usersById[r.user_id]?.user_name || null : null,
    role: r.role,
    status: r.user_id ? 'member' : 'pending', // derived status
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}


async function assignRole({ org_user_id, role }) {
  if (!org_user_id || !role) throw new Error('org_user_id and role are required');

  const link = await OrgUser.findByPk(org_user_id);
  if (!link) throw new Error('Member link not found');

  // Enforce that role assignment only for linked users
  if (!link.user_id) throw new Error('Cannot assign role to a pending invite');

  link.role = role;
  await link.save();

  return { org_user_id: link.org_user_id, role: link.role };
}


async function removeMember(org_user_id) {
  if (!org_user_id) throw new Error('org_user_id is required');

  const link = await OrgUser.findByPk(org_user_id);
  if (!link) throw new Error('Member link not found');

  await link.destroy();
  return { removed: true };
}

/**
 * Auto-link on registration:
 * Call this from your /auth/register service after creating a User.
 * It links any pending OrgUsers rows with matching email.
 */
async function linkPendingInvitesOnRegister({ user_id, email }) {
  if (!user_id || !email) return;

  await OrgUser.update(
    { user_id },
    { where: { email, user_id: null } }
  );
}

module.exports = {
  inviteMember,
  viewMembers,
  assignRole,
  removeMember,
  linkPendingInvitesOnRegister,
};
