const router = require('express').Router();
const {
  createOrgController,
  getOrgByIdController,
  updateOrgController,
} = require('./orgController');

// Create organization
router.post('/create-org', createOrgController);

// Get organization by ID
router.get('/view-org', getOrgByIdController);

// Update organization
router.patch('/update-org/:id', updateOrgController);

module.exports = router;
