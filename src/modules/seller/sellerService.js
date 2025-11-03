const Seller = require('./sellerModel');
const {where} = require("sequelize");

async function findSellerById(seller_id){

    if(!seller_id){
        throw new Error('Seller id is required');
    }
    const seller = await Seller.findOne({ where: { seller_id } });
    if(!seller){
        throw new Error('Seller does not exist ');
    }

    return seller;
}

module.exports = { findSellerById };