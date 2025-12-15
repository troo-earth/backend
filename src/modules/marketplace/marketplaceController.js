// marketplace/marketplaceController.js
const marketplaceService = require('./marketplaceService');
const { withLogging } = require('../../utils/logger');

// Named functions (already good)
async function getAllProjects(req, res, next) {
  try {
    const { status } = req.query;
    const options = { status };
    const data = await marketplaceService.getAllProjects(options);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function syncIcrProjects(req, res, next) {
  try {
    const data = await marketplaceService.syncIcrProjects();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const { id } = req.params;  // From URL: /projects/:id
    const data = await marketplaceService.getProjectById(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllProjects: withLogging(getAllProjects, 'getAllProjectsController'),  // Pass name
  getProjectById: withLogging(getProjectById, 'getProjectByIdController'),  // Pass name
  syncIcrProjects: withLogging(syncIcrProjects, 'syncIcrProjectsController'),  // Pass name
};