const {
  viewOrgRetirementService,
  viewOneRetirementService,
} = require('./retirementService');
const { withLogging } = require('../../utils/logger');
const { validate: uuidValidate } = require('uuid');

const viewOrgRetirementController = async (req, res, next) => {
  try {
    const org_id = req.session?.user?.org_id;

    const result = await viewOrgRetirementService(org_id);
    if (result.error) {
      return res.error(result.error, result.statusCode);
    }

    return res.success(
      'Organization retirements fetched successfully',
      result.data
    );
  } catch (error) {
    next(error);
  }
};

const viewOneRetirementController = async (req, res, next) => {
  try {
    const certificate_id = req.body?.certificate_id;

    if (!certificate_id) {
      return res.error(
        'certificate_id is required',
        400
      );
    }

    if (!uuidValidate(certificate_id)) {
      return res.error(
        'Invalid certificate_id format',
        400
      );
    }

    const result = await viewOneRetirementService(certificate_id);

    if (result.error) {
      return res.error(result.error, result.statusCode);
    }

    return res.success(
      'Retirement certificate fetched successfully',
      result.data
    );

  } catch (error) {
    next(error);
  }
};



module.exports = {
  viewOrgRetirementController: withLogging(viewOrgRetirementController, 'viewOrgRetirementController'),
  viewOneRetirementController: withLogging(viewOneRetirementController, 'viewOneRetirementController'),
};
