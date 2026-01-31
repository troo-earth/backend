const router = require('express').Router();
const {
  createOrgController,
  getOrgByIdController,
  updateOrgController,
} = require('./orgController');
const { requirePermission } = require('../../middleware/rbacMiddleware');

// Create organization
router.post('/create-org', createOrgController);

// Get organization by ID
router.get('/view-org', getOrgByIdController);

// Update organization (requires USER_MANAGEMENT)
router.patch('/update-org/:id', requirePermission('USER_MANAGEMENT'), updateOrgController);

module.exports = router;
