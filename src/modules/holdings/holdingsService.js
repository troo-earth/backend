// src/modules/holdings/holdingsService.js
const Holdings = require('./holdingsModel.js');
const Orgs = require('../org/orgModel.js');
const { withLogging } = require('../../utils/logger'); 

const viewHoldingService = async (org_id) => {
  if (!org_id) {
    return { error: 'org_id is required', statusCode: 400 };
  }

  const org = await Orgs.findByPk(org_id);
  if (!org) {
    return { error: 'Organization not found', statusCode: 404 };
  }

  const holdings = await Holdings.findAll({
    where: { org_id },
    attributes: { exclude: ['createdAt', 'updatedAt'] },
  });

  return { data: holdings };
};


module.exports = {
  viewHoldingService: withLogging(viewHoldingService, 'viewHoldingService'),
};