// src/modules/listing/listingService.js
const Listing = require('./listingModel.js');
const { withLogging } = require('../../utils/logger');

const createListingService = async (listingData) => {
    try {
        const newListing = await Listing.create({
            project_id: listingData.project_id,
            seller_id: listingData.seller_id || null, // Optional
            credits_available: listingData.credits_available,
            price_per_credit: listingData.price_per_credit,
            external_trade_id: listingData.external_trade_id || null,
            project_name: listingData.project_name,
            project_start_year: listingData.project_start_year,
            registry: listingData.registry,
            category: listingData.category,
            location_city: listingData.location_city,
            location_state: listingData.location_state,
            location_country: listingData.location_country,
            thumbnail_url: listingData.thumbnail_url,
            status: listingData.status || 'open', // Default to 'open'
            sdg_numbers: listingData.sdg_numbers || null,
            methodology: listingData.methodology,
            vintage_year: listingData.vintage_year || null,
        });
        return newListing;
    } catch (error) {
        throw new Error(`Failed to create listing: ${error.message}`);
    }
};

const getAllListingsService = async () => {
    try {
        const listings = await Listing.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] }, // Optional: exclude timestamps if not needed
        });
        return listings;
    } catch (error) {
        throw new Error(`Failed to fetch listings: ${error.message}`);
    }
};

module.exports = {
    createListingService: withLogging(createListingService, 'createListingService'),
    getAllListingsService: withLogging(getAllListingsService, 'getAllListingsService'),
};