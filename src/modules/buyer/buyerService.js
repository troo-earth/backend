// services/buyerService.js
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
// Use local buyerModel which exposes Buyer
const { Buyer } = require('./buyerModel');
const { withLogging } = require('../../utils/logger');

async function getBuyerByUserId(user_id) {
  if (!user_id) throw new Error('Missing user ID');

  const buyer = await Buyer.findOne({ where: { user_id } });
  if (!buyer) throw new Error('Buyer not found');

  return buyer;
}

async function getBuyerByType(buyer_type) {
  if (!buyer_type) throw new Error('Missing buyer type');

  const buyers = await Buyer.findAll({ where: { buyer_type }, order: [['created_at', 'DESC']] });
  return buyers;
}

module.exports = {
  getBuyerByUserId: withLogging(getBuyerByUserId, 'getBuyerByUserId'),
  getBuyerByType: withLogging(getBuyerByType, 'getBuyerByType'),
};
