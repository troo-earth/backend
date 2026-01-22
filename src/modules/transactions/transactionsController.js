const { viewTransactionsService } = require('./transactionsService');
const { withLogging } = require('../../utils/logger');

const viewTransactionsController = async (req, res, next) => {
  try {
    const org_id = req.session?.user?.org_id;

    const result = await viewTransactionsService(org_id);

    if (result.error) {
      return res.error(result.error, result.statusCode);
    }

    return res.success(
      'Transactions fetched successfully',
      result.data
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  viewTransactionsController: withLogging(viewTransactionsController, 'viewTransactionsController'),
};
