const express = require('express');
const router = express.Router();
const { buyCreditsController, sellCreditsController } = require('./tradingController');
// Route for buying credits
router.post('/buy-credits', buyCreditsController);
// Route for selling credits
router.post('/sell-credits', sellCreditsController);

module.exports = router;