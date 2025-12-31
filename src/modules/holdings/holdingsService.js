// src/modules/holdings/holdingsService.js
const Holdings = require('./holdingsModel.js');
const { withLogging } = require('../../utils/logger'); 

const viewHoldingService = async (org_id) => {
  try {
    const holdings = await Holdings.findAll({
      where: { org_id },
      attributes: { exclude: ['createdAt', 'updatedAt'] }, // Optional: exclude timestamps if not needed
    });
    return holdings;
  } catch (error) {
    throw new Error(`Failed to fetch holdings: ${error.message}`);
  }
};

module.exports = {
  viewHoldingService: withLogging(viewHoldingService, 'viewHoldingService'),
};