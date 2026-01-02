const express = require('express');
const router = express.Router();
const { buyCreditsController, sellCreditsController, transferCreditsController } = require('./tradingController');
// Route for buying credits
router.post('/buy-credits', buyCreditsController);
// Route for selling credits
router.post('/sell-credits', sellCreditsController);
// Route for transferring credits
router.post('/transfer-credits', transferCreditsController);

module.exports = router;