const { createPaymentIntentService } = require('./paymentService');
const { withLogging } = require('../../utils/logger');

async function createPaymentIntentController(req, res, next) {
  try {
    // Require login
    // For testing: fixed amount $20.00 (2000 cents)
    // Later: get amount from req.body or calculate based on cart/subscription
    const amount = 2000;

    const paymentIntent = await createPaymentIntentService({
      amount,
      metadata: {
        //user_id: req.session.user.id.toString(),
      },
    });

    return res.success('Payment intent created', {
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    next(error);
  }
}

module.exports = {
  createPaymentIntentController: withLogging(createPaymentIntentController, 'createPaymentIntentController'),
};