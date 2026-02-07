// marketplace/marketplaceRoutes.js
const express = require('express');
const router = express.Router();
const { getAllProjects, getProjectById, syncIcrProjects } = require('./marketplaceController');
const { requirePermission } = require('../../middleware/rbacMiddleware');

// Import your errorHandler or auth middleware if needed
// const errorHandler = require('../../middleware/errorHandler');

// GET /api/marketplace/projects (all projects with optional status filter)
router.get('/projects', getAllProjects);

// GET /api/marketplace/projects/:id (single project details)
router.get('/projects/:id', getProjectById);

// Admin sync route (add auth middleware later)
router.post('/admin-sync', syncIcrProjects);

// GET /api/marketplace/projects/:id (single project)
router.get('/projects/:id', getProjectById);

// TODO: Add more routes (e.g., POST /retire)
// router.post('/retire', auth, controller.retireCredits);

module.exports = router;