const router = require('express').Router();
const { viewTransactionsController } = require('./transactionsController');

// View organization transactions

router.get('/get-transactions', viewTransactionsController);
module.exports = router;