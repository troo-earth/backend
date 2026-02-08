const express = require('express');
const router = express.Router();
const {
    buyCreditsController,
    sellCreditsController,
    transferCreditsController,
    retireCreditsController
} = require('./tradingController');
const authorizePermission = require('../../middleware/authorizePermission');
const { PERMISSIONS } = require('../../constants/permissions');

// Route for buying credits
router.post('/buy-credits', authorizePermission(PERMISSIONS.BUY_CREDITS), buyCreditsController);
// Route for selling credits
router.post('/sell-credits', authorizePermission(PERMISSIONS.SELL_CREDITS), sellCreditsController);
// Route for retiring credits
router.post('/retire-credits', authorizePermission(PERMISSIONS.RETIRE_CREDITS), retireCreditsController);
// Route for transferring credits
router.post('/transfer-credits', authorizePermission(PERMISSIONS.TRANSFER_CREDITS), transferCreditsController);

module.exports = router;