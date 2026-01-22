const {
  createOrgService,
  getOrgByIdService,
  updateOrgService,
} = require('./orgService');
const { withLogging } = require('../../utils/logger');

async function createOrgController(req, res, next) {
  try {
    if (!req.session?.user?.user_id) {
      return res.error('Unauthenticated', 401);
    }

    const org = await createOrgService(req.body, req.session.user);

    // ✅ update session immediately
    req.session.user.org_id = org.org_id;

    return res.success(
      'Organization created successfully',
      org
    );

  } catch (error) {
    const statusMap = {
      'org_name and country_code are required': 400,
      'Unauthenticated': 401,
    };

    const status = statusMap[error.message];
    if (status) {
      return res.error(error.message, status);
    }

    next(error);
  }
}

async function getOrgByIdController(req, res, next) {
  try {
    const { id: org_id } = req.params;

    if (!org_id) {
      return res.error('Missing org_id', 400);
    }

    const org = await getOrgByIdService(org_id);

    return res.success(
      'Organization fetched successfully',
      org
    );

  } catch (error) {
    const statusMap = {
      'Missing org_id': 400,
      'Org not found': 404,
    };

    const status = statusMap[error.message];
    if (status) {
      return res.error(error.message, status);
    }

    next(error);
  }
}

async function updateOrgController(req, res, next) {
  try {
    const { id: org_id } = req.params;
    const updateFields = req.body || {};

    if (!org_id) {
      return res.error('Missing org_id', 400);
    }

    const org = await updateOrgService(org_id, updateFields);

    return res.success(
      'Organization updated successfully',
      org
    );

  } catch (error) {
    const statusMap = {
      'Missing org_id': 400,
      'No update fields provided': 400,
      'No valid fields to update': 400,
      'Org not found': 404,
    };

    const status = statusMap[error.message];
    if (status) {
      return res.error(error.message, status);
    }

    next(error);
  }
}


module.exports = {
  createOrgController: withLogging(createOrgController, 'createOrgController'),
  getOrgByIdController: withLogging(getOrgByIdController, 'getOrgByIdController'),
  updateOrgController: withLogging(updateOrgController, 'updateOrgController'),
};
