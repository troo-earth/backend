const express = require('express');
const { viewHoldingController } = require('./holdingsController');

const router = express.Router();

// GET: Fetch holdings by org_id
router.get('/view-holdings/:org_id', viewHoldingController);

module.exports = router;