const express = require('express');
const router = express.Router();
const { buyCreditsController } = require('./tradingController'); // Adjust path if needed

// Route for buying credits
router.post('/buy-credits', buyCreditsController);

module.exports = router;