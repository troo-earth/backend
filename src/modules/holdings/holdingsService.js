// src/modules/holdings/holdingsService.js
const Holdings = require('./holdingsModel.js');
const Orgs = require('../org/orgModel.js');
const IcrProject = require('../marketplace/models/icrProjects');
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

const getProjectByHoldingIdService = async (holding_id, org_id) => {
  if (!holding_id) {
    return { error: 'holding_id is required', statusCode: 400 };
  }

  // 1. Fetch holding
  const holding = await Holdings.findByPk(holding_id);

  if (!holding) {
    return { error: 'Holding not found', statusCode: 404 };
  }

  if (holding.org_id !== org_id) {
    return { error: 'Unauthorized access to holding', statusCode: 403 };
  }

  // 2. Fetch full project (exclude timestamps only)
  const project = await IcrProject.findByPk(holding.project_id, {
    attributes: { exclude: ['createdAt', 'updatedAt'] },
  });

  if (!project) {
    return { error: 'Project not found', statusCode: 404 };
  }

  // 3. Return merged payload
  return {
    data: {
      holding_id: holding.holding_id,
      project_id: holding.project_id,
      ...project.toJSON(),
    },
  };
};

module.exports = {
  viewHoldingService: withLogging(viewHoldingService, 'viewHoldingService'),
  getProjectByHoldingIdService: withLogging(getProjectByHoldingIdService, 'getProjectByHoldingIdService'),
};