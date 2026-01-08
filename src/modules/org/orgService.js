const Org = require('./orgModel');
const User = require('../user/userModel');

async function createOrg({ org_name }) {
  if (!org_name || org_name.trim() === '') {
    throw new Error('Organization name is required');
  }

  const existing = await Org.findOne({ where: { org_name } });
  if (existing) {
    throw new Error('Organization already exists');
  }

  return await Org.create({ org_name });
}
async function getOrgById(org_id) {
  // 1️⃣ Validate input
  if (!org_id) throw new Error('Organization ID is required');

  // 2️⃣ Fetch organization info
  const org = await Org.findByPk(org_id, {
    attributes: ['org_id', 'org_name', 'createdAt', 'updatedAt'],
  });
  if (!org) return null;


  // const orgUsers = await OrgUser.findAll({
  //   where: { org_id },
  //   attributes: ['org_user_id', 'org_id', 'user_id', 'email', 'role', 'createdAt'],
  // });

  const userIds = orgUsers.map(u => u.user_id).filter(Boolean);

  
  let users = [];
  if (userIds.length > 0) {
    users = await User.findAll({
      where: { user_id: userIds },
      attributes: ['user_id', 'user_name', 'email'],
    });
  }

 
  const members = orgUsers.map(row => {
    const matchedUser = users.find(u => u.user_id === row.user_id);
    return {
      org_user_id: row.org_user_id,
      user_id: row.user_id,
      email: matchedUser ? matchedUser.email : row.email, 
      user_name: matchedUser ? matchedUser.user_name : '(invited user)',
      role: row.role || '—',
      status: !row.user_id
        ? 'pending'
        : row.user_id && !row.role
        ? 'registered'
        : 'active',
    };
  });

  
  return {
    org_id: org.org_id,
    org_name: org.org_name,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
    memberCount: members.length,
    members,
  };
}

module.exports = { createOrg, getOrgById };
