const express = require('express');
const { createPaymentIntentController } = require('./paymentController');

const router = express.Router();

router.post('/create-intent', createPaymentIntentController);

module.exports = router;