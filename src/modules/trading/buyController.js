const { buyCreditsService } = require('./buyService'); // Adjust path if needed
const { withLogging } = require('../../utils/logger');
const { validate: uuidValidate } = require('uuid');

async function buyCreditsController(req, res, next) {
  try {
    const { listing_id, buyer_org_id, amount } = req.body || {};

    // Basic HTTP-level check for required fields
    if (!listing_id || !buyer_org_id || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate UUID format for listing_id and buyer_org_id using uuid library
    if (!uuidValidate(listing_id)) {
      return res.status(400).json({ success: false, message: 'Invalid UUID format for listing_id' });
    }
    if (!uuidValidate(buyer_org_id)) {
      return res.status(400).json({ success: false, message: 'Invalid UUID format for buyer_org_id' });
    }

    // Additional validation for amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    const result = await buyCreditsService(listing_id, buyer_org_id, parsedAmount);

    // No sanitization needed; result is already safe
    return res.status(201).json({ success: true, message: 'Purchase successful', data: result });
  } catch (error) {
    const statusMap = {
      'Listing not found': 404,
      'Listing is not open for purchase': 400,
      'Insufficient credits available in the listing': 400,
      // Add more mappings as needed for other service errors
    };

    const status = statusMap[error.message] || 500;
    if (status !== 500) {
      return res.status(status).json({ success: false, message: error.message });
    }
    next(error);  // Pass unexpected errors to global handler
  }
}

module.exports = { buyCreditsController: withLogging(buyCreditsController, 'buyCreditsController') };