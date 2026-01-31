const express = require('express');
const router = express.Router();
const { viewOrgRetirementController, viewOneRetirementController } = require('./retirementController');
     
router.get('/view-org', viewOrgRetirementController);  
router.post('/view-one', viewOneRetirementController); 

module.exports = router;