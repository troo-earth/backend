const express = require('express');
const router = express.Router();
const {
    buyCreditsController,
    sellCreditsController,
    transferCreditsController,
    retireCreditsController
} = require('./tradingController');
const { requirePermission } = require('../../middleware/rbacMiddleware');

// Route for buying credits
router.post('/buy-credits', requirePermission('BUY'), buyCreditsController);
// Route for selling credits
router.post('/sell-credits', requirePermission('SELL'), sellCreditsController);
// Route for retiring credits
router.post('/retire-credits', requirePermission('RETIRE'), retireCreditsController);
// Route for transferring credits
router.post('/transfer-credits', requirePermission('TRANSFER'), transferCreditsController);

module.exports = router;