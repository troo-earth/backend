// controllers/buyerController.js
const {
  getBuyerByUserId,
  getBuyerByType,
} = require('./buyerService');
const { withLogging } = require('../../utils/logger');

// GET /buyer/user/:userId
async function getBuyerByUserIdController(req, res, next) {
  try {
    const user_id = req.params.userId || req.user?.user_id;
    if (!user_id) return res.error('Missing user ID', 400);

    const data = await getBuyerByUserId(user_id);
    return res.success('Buyer retrieved', data);
  } catch (error) {
    if (error.message === 'Missing user ID') return res.error(error.message, 400);
    if (error.message === 'Buyer not found') return res.error(error.message, 404);
    next(error);
  }
}

// GET /buyer/type/:buyerType
async function getBuyerByTypeController(req, res, next) {
  try {
    const buyer_type = req.params.buyerType;
    if (!buyer_type) return res.error('Missing buyer type', 400);

    const buyers = await getBuyerByType(buyer_type);
    return res.success('Buyers retrieved', buyers);
  } catch (error) {
    if (error.message === 'Missing buyer type') return res.error(error.message, 400);
    next(error);
  }
}

module.exports = {
  getBuyerByUserIdController: withLogging(getBuyerByUserIdController, 'getBuyerByUserIdController'),
  getBuyerByTypeController: withLogging(getBuyerByTypeController, 'getBuyerByTypeController'),
};
