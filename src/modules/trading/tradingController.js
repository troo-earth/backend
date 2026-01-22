const {
  sellCreditsService,
  transferCreditsService,
  retireCreditsService
} = require('./tradingService');
const { withLogging } = require('../../utils/logger');
const { validate: uuidValidate } = require('uuid');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function buyCreditsController(req, res, next) {
  try {
    const { listing_id, buyer_org_id, amount } = req.body || {};

    // Basic HTTP-level validation
    if (!listing_id || !buyer_org_id || !amount) {
      return res.error('Missing required fields', 400);
    }

    if (!uuidValidate(listing_id)) {
      return res.error('Invalid UUID format for listing_id', 400);
    }

    if (!uuidValidate(buyer_org_id)) {
      return res.error('Invalid UUID format for buyer_org_id', 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.error('Amount must be a positive number', 400);
    }

    // Convert credits → cents (adapt if pricing logic changes)
    const amountInCents = Math.round(parsedAmount * 100);

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'sgd', // keep consistent with your system
      automatic_payment_methods: { enabled: true },

      metadata: {
        listing_id,
        buyer_org_id,
        credits_amount: parsedAmount.toString(),
      },
    });

    return res.success('Payment intent created', {
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    const statusMap = {
      'Listing not found': 404,

      'Insufficient credits available in the listing': 409,
      'Listing is not open for purchase': 409,
      'Seller does not have enough locked credits': 409,

      // Internal consistency errors
      'Seller holdings not found': 500,
    };

    const status = statusMap[error.message] || 500;
    if (status !== 500) {
      return res.error(error.message, status);
    }
    next(error);
  }
}

async function sellCreditsController(req, res, next) {
  try {
    const { org_id, project_id, amount, price } = req.body || {};

    // Basic HTTP-level check for required fields
    if (!org_id || !project_id || !amount || !price) {
      return res.error('Missing required fields', 400);
    }

    // Validate UUID format for org_id and project_id using uuid library
    if (!uuidValidate(org_id)) {
      return res.error('Invalid UUID format for org_id', 400);
    }
    if (!uuidValidate(project_id)) {
      return res.error('Invalid UUID format for project_id', 400);
    }

    // Additional validation for amount and price
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.error('Amount must be a positive number', 400);
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.error('Price must be a positive number', 400);
    }

    const result = await sellCreditsService(org_id, project_id, parsedAmount, parsedPrice);

    // No sanitization needed; result is already safe
    return res.status(201).success('Listing created successfully', result);
  } catch (error) {
    const statusMap = {
      'No holdings found for this project': 404,
      'Insufficient credits to sell': 400,
      'Project not found': 404,
      // Add more mappings as needed for other service errors
    };

    const status = statusMap[error.message] || 500;
    if (status !== 500) {
      return res.error(error.message, status);
    }
    next(error);  // Pass unexpected errors to global handler
  }
}

async function transferCreditsController(req, res, next) {
  try {
    const from_org_id = req.session?.user?.org_id;
    const { to_org_code, project_id, amount } = req.body || {};

    if (!from_org_id) {
      return res.error('User not associated with an organization', 403);
    }

    if (!to_org_code || !project_id || !amount) {
      return res.error('Missing required fields', 400);
    }

    if (!uuidValidate(project_id)) {
      return res.error('Invalid UUID format for project_id', 400);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.error('Amount must be a positive number', 400);
    }

    const result = await transferCreditsService(
      from_org_id,
      to_org_code,
      project_id,
      parsedAmount
    );

    return res.success('Transfer successful', result);

  } catch (error) {
    const statusMap = {
      'Cannot transfer to the same organization': 400,
      'No Holdings found for this project': 404,
      'Insufficient available credits to transfer': 400,
      'Target organization not found': 404,
    };

    const status = statusMap[error.message];
    if (status) {
      return res.error(error.message, status);
    }

    next(error);
  }
}


const retireCreditsController = async (req, res) => {
  try {
    const {
      org_id,
      project_id,
      amount,
      purpose,
      beneficiary
    } = req.body;

    if (!org_id || !project_id || !amount) {
      return res.error('org_id, project_id and amount are required', 400);
    }

    if (amount <= 0) {
      return res.error('Amount must be a positive number', 400);
    }

    const result = await retireCreditsService(
      org_id,
      project_id,
      amount,
      purpose,
      beneficiary
    );

    return res.success('Credits retired successfully', result);

  } catch (error) {
    return res.error(error.message, 400);
  }
};

module.exports = {
  buyCreditsController: withLogging(buyCreditsController, 'buyCreditsController'),
  sellCreditsController: withLogging(sellCreditsController, 'sellCreditsController'),
  transferCreditsController: withLogging(transferCreditsController, 'transferCreditsController'),
  retireCreditsController: withLogging(retireCreditsController, 'retireCreditsController')
};