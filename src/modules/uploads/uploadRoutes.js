const router = require('express').Router();
const { requirePermission } = require('../../middleware/rbacMiddleware');
const {
  uploadOrgLogoController,
  uploadOrgDocController,
} = require('./uploadController');

router.post('/org-logo', requirePermission('USER_MANAGEMENT'), uploadOrgLogoController);
router.post('/org-doc', requirePermission('USER_MANAGEMENT'), uploadOrgDocController);

module.exports = router;
