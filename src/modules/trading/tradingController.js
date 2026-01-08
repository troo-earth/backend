const { buyCreditsService, sellCreditsService, transferCreditsService, retireCreditsService } = require('./tradingService'); // Adjust path if needed
const { withLogging } = require('../../utils/logger');
const { validate: uuidValidate } = require('uuid');

async function buyCreditsController(req, res, next) {
  try {
    const { listing_id, buyer_org_id, amount } = req.body || {};

    // Basic HTTP-level check for required fields
    if (!listing_id || !buyer_org_id || !amount) {
      return res.error('Missing required fields', 400);
    }

    // Validate UUID format for listing_id and buyer_org_id using uuid library
    if (!uuidValidate(listing_id)) {
      return res.error('Invalid UUID format for listing_id', 400);
    }
    if (!uuidValidate(buyer_org_id)) {
      return res.error('Invalid UUID format for buyer_org_id', 400);
    }

    // Additional validation for amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.error('Amount must be a positive number', 400);
    }

    const result = await buyCreditsService(listing_id, buyer_org_id, parsedAmount);

    // No sanitization needed; result is already safe
    return res.success('Purchase successful', result);
  } catch (error) {
    const statusMap = {
      'Listing not found': 404,
      'Listing is not open for purchase': 400,
      'Insufficient credits available in the listing': 400,
      // Add more mappings as needed for other service errors
    };

    const status = statusMap[error.message] || 500;
    if (status !== 500) {
      return res.error(error.message, status);
    }
    next(error);  // Pass unexpected errors to global handler
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
    const { from_org_id, to_org_id, project_id, amount } = req.body || {};

    // Basic HTTP-level check for required fields
    if (!from_org_id || !to_org_id || !project_id || !amount) {
      return res.error('Missing required fields', 400);
    }

    // Validate UUID format for from_org_id, to_org_id, and project_id
    if (!uuidValidate(from_org_id)) {
      return res.error('Invalid UUID format for from_org_id', 400);
    }
    if (!uuidValidate(to_org_id)) {
      return res.error('Invalid UUID format for to_org_id', 400);
    }
    if (!uuidValidate(project_id)) {
      return res.error('Invalid UUID format for project_id', 400);
    }

    // Additional validation for amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.error('Amount must be a positive number', 400);
    }

    const result = await transferCreditsService(from_org_id, to_org_id, project_id, parsedAmount);

    // No sanitization needed; result is already safe
    return res.status(201).success('Transfer successful', result);
  } catch (error) {
    const statusMap = {
      'Cannot transfer to the same organization': 400,
      'Sender has no holdings': 404,
      'Insufficient available credits to transfer': 400,
      // Add more mappings as needed for other service errors
    };

    const status = statusMap[error.message] || 500;
    if (status !== 500) {
      return res.error(error.message, status);
    }
    next(error);  // Pass unexpected errors to global handler
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