const Transactions = require('./transactionsModel');
const { withLogging } = require('../../utils/logger');

const viewTransactionsService = async (org_id) => {
  if (!org_id) {
    return { error: 'org_id missing from session', statusCode: 401 };
  }

  const transactions = await Transactions.findAll({
    where: {
      [require('sequelize').Op.or]: [
        { from_org_id: org_id },
        { to_org_id: org_id }
      ]
    },
    order: [['createdAt', 'DESC']],
  });

  return { data: transactions };
};

module.exports = {
  viewTransactionsService: withLogging(viewTransactionsService, 'viewTransactionsService'),
};
