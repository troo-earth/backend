// src/modules/listing/listingService.js
const Listing = require('./listingModel.js');
const IcrProject = require('../marketplace/models/icrProjects');
const Org = require('../org/orgModel');
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

const getOrgListingsService = async (org_id) => {
  if (!org_id) {
    return {
      error: 'Organization not associated with user',
      statusCode: 403,
    };
  }

  const listings = await Listing.findAll({
    where: { seller_id: org_id },
    order: [['createdAt', 'DESC']],
  });

  return { data: listings };
};

async function getListingByIdService(listing_id) {
  if (!listing_id) {
    return { error: 'listing_id is required', statusCode: 400 };
  }

  const listing = await Listing.findByPk(listing_id);
  if (!listing) {
    return { error: 'Listing not found', statusCode: 404 };
  }

  // Fetch project
  const project = await IcrProject.findByPk(listing.project_id);
  if (!project) {
    return { error: 'Project not found for listing', statusCode: 404 };
  }

  // Seller logic
  let seller;
  if (listing.seller_id) {
    const org = await Org.findByPk(listing.seller_id);
    seller = org
      ? {
          type: 'org',
          org_id: org.org_id,
          org_name: org.org_name,
          org_code: org.org_code,
        }
      : { type: 'unknown' };
  } else {
    seller = {
      type: 'registry',
      name: listing.registry || 'Registry',
    };
  }

  return {
    data: {
      listing_id: listing.listing_id,
      price_per_credit: listing.price_per_credit,
      credits_available: listing.credits_available,
      seller,
      project,
    },
  };
}

module.exports = {
    createListingService: withLogging(createListingService, 'createListingService'),
    getAllListingsService: withLogging(getAllListingsService, 'getAllListingsService'),
    getOrgListingsService: withLogging(getOrgListingsService, 'getOrgListingsService'),
    getListingByIdService: withLogging(getListingByIdService, 'getListingByIdService'),
};