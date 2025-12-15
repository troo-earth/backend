const { withLogging } = require('../../utils/logger');

async function createPaymentIntentService({ amount, currency = 'sgd', metadata = {} }) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  const paymentIntent = await stripe.paymentIntents.create({
    amount, // in cents (e.g., 2000 = $20.00)
    currency,
    metadata, // Optional: pass user_id, order info, etc.
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

module.exports = {
  createPaymentIntentService: withLogging(createPaymentIntentService, 'createPaymentIntentService'),
};