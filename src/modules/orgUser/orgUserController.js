const {
  inviteMember,
  viewMembers,
  assignRole,
  removeMember,
} = require('./orgUserService');

async function inviteMemberController(req, res, next) {
  try {
    const { org_id, email } = req.body;
    if (!org_id || !email) return res.error('Missing org_id or email', 400);
    const result = await inviteMember({ org_id, email });
    return res.success('Invite processed', result);
  } catch (err) {
    if (['User already part of this organization', 'Invite already exists for this email'].includes(err.message)) {
      return res.error(err.message, 409);
    }
    if (err.message === 'org_id and email are required') return res.error(err.message, 400);
    next(err);
  }
}

async function viewMembersController(req, res, next) {
  try {
    const { org_id } = req.params;
    const data = await viewMembers(org_id);
    return res.success('Members fetched', data);
  } catch (err) {
    next(err);
  }
}

async function assignRoleController(req, res, next) {
  try {
    const { org_user_id, role } = req.body;
    const data = await assignRole({ org_user_id, role });
    return res.success('Role assigned', data);
  } catch (err) {
    if (['Member link not found', 'Cannot assign role to a pending invite'].includes(err.message)) {
      return res.error(err.message, 400);
    }
    next(err);
  }
}

async function removeMemberController(req, res, next) {
  try {
    const { org_user_id } = req.params;
    const data = await removeMember(org_user_id);
    return res.success('Member removed', data);
  } catch (err) {
    if (err.message === 'Member link not found') return res.error(err.message, 404);
    next(err);
  }
}

module.exports = {
  inviteMemberController,
  viewMembersController,
  assignRoleController,
  removeMemberController,
};
