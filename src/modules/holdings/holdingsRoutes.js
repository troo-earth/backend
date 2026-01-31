const express = require('express');
const { viewHoldingController, getProjectByHoldingIdController } = require('./holdingsController');

const router = express.Router();

// GET: Fetch holdings by org_id
router.get('/view-holdings', viewHoldingController);

// POST: Fetch project by holding_id
router.post('/view-project', getProjectByHoldingIdController);

module.exports = router;