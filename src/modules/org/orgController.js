const {
  createOrgService,
  getOrgByIdService,
  updateOrgService,
} = require('./orgService');
const { withLogging } = require('../../utils/logger');

async function createOrgController(req, res, next) {
  try {
    const { org_name, country_code } = req.body;

    if (!org_name || !country_code) {
      return res.error('org_name and country_code are required', 400);
    }

    const actor = req.session.user;

    const org = await createOrgService(req.body, actor.user_id);

    // Regenerate session because role privilege changed
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.user = {
        user_id: actor.user_id,
        fullname: actor.fullname,
        email: actor.email,
        org_id: org.org_id,
        role: 'superadmin',
      };

      return res.success('Organization created successfully', org);
    });

  } catch (error) {
    next(error);
  }
}

async function getOrgByIdController(req, res, next) {
  try {
    const org_id = req.session?.user?.org_id;

    if (!org_id) {
      return res.error(
        'User is not associated with any organization',
        403
      );
    }

    const org = await getOrgByIdService(org_id);

    return res.success(
      'Organization fetched successfully',
      org
    );

  } catch (error) {
    const statusMap = {
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
