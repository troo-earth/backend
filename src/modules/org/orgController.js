const { createOrg, getOrgById } = require('./orgService');

async function createOrgController(req, res, next) {
  try {
    const { org_name } = req.body;

    if (!org_name) {
      return res.error('Missing organization name', 400);
    }

    const org = await createOrg({ org_name });
    return res.success('Organization created successfully', org);

  } catch (error) {
    if (error.message === 'Organization already exists') {
      return res.error(error.message, 409);
    }
    next(error);
  }
}

async function getOrgController(req, res, next) {
  try {
    const { org_id } = req.params;

    if (!org_id) {
      return res.error('Organization ID is required', 400);
    }

    const org = await getOrgById(org_id);

    if (!org) {
      return res.error('Organization not found', 404);
    }

    return res.success('Organization fetched successfully', org);
  } catch (error) {
    next(error);
  }
}

module.exports = { createOrgController, getOrgController };
