const express = require('express');
const router = express.Router();
const { viewAllRetirementsController, viewOrgRetirementsController } = require('./retirementController');

router.get('/view-all', viewAllRetirementsController);        
router.get('/view-org', viewOrgRetirementsController);   

module.exports = router;