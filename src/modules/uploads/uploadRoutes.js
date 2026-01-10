const router = require('express').Router();
const {
  uploadOrgLogoController,
  uploadOrgDocController,
} = require('./uploadController');

router.post('/org-logo', uploadOrgLogoController);
router.post('/org-doc', uploadOrgDocController);

module.exports = router;
