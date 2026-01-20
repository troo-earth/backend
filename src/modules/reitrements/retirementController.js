const {
  viewAllRetirementsService,
  viewOrgRetirementsService,
} = require('./retirementService');
const { withLogging } = require('../../utils/logger');

const viewAllRetirementsController = async (req, res, next) => {
  try {
    const result = await viewAllRetirementsService();
    return res.success('All retirements fetched successfully', result.data);
  } catch (error) {
    next(error);
  }
};

const viewOrgRetirementsController = async (req, res, next) => {
  try {
    const org_id = req.session?.user?.org_id;

    const result = await viewOrgRetirementsService(org_id);

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

module.exports = {
    viewAllRetirementsController: withLogging(viewAllRetirementsController, 'viewAllRetirementsController'),
    viewOrgRetirementsController: withLogging(viewOrgRetirementsController, 'viewOrgRetirementsController'),
};
