const {
  createOrgService,
  getOrgByIdService,
  updateOrgService,
} = require('./orgService');
const { withLogging } = require('../../utils/logger');

async function createOrgController(req, res, next) {
  try {
    const org = await createOrgService(req.body);

    return res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: org,
    });
  } catch (error) {
    const statusMap = {
      'org_name and country_code are required': 400,
    };

    const status = statusMap[error.message] || 500;

    if (status !== 500) {
      return res.status(status).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
}

/**
 * Get organization by ID
 */
async function getOrgByIdController(req, res, next) {
  try {
    const { id: org_id } = req.params;

    const org = await getOrgByIdService(org_id);

    return res.status(200).json({
      success: true,
      data: org,
    });
  } catch (error) {
    const statusMap = {
      'Missing org_id': 400,
      'Org not found': 404,
    };

    const status = statusMap[error.message] || 500;

    if (status !== 500) {
      return res.status(status).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
}

/**
 * Update organization
 */
async function updateOrgController(req, res, next) {
  try {
    const { id: org_id } = req.params;
    const updateFields = req.body || {};

    const org = await updateOrgService(org_id, updateFields);

    return res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: org,
    });
  } catch (error) {
    const statusMap = {
      'Missing org_id': 400,
      'No update fields provided': 400,
      'No valid fields to update': 400,
      'Org not found': 404,
    };

    const status = statusMap[error.message] || 500;

    if (status !== 500) {
      return res.status(status).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
}

module.exports = {
  createOrgController: withLogging(createOrgController, 'createOrgController'),
  getOrgByIdController: withLogging(getOrgByIdController, 'getOrgByIdController'),
  updateOrgController: withLogging(updateOrgController, 'updateOrgController'),
};
