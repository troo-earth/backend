// src/modules/listing/listingService.js
const Listing = require('./listingModel');
const IcrProject = require('../marketplace/models/icrProjects');
const Org = require('../org/orgModel');
const Holdings = require('../holdings/holdingsModel');
const { withLogging } = require('../../utils/logger');
const sequelize  = require('../../config/database');
const { createListingEvent } = require('../listingEvents/listingEventsService');


const createListingService = async (listingData) => {
  const t = await sequelize.transaction();
  try {
    const listing = await Listing.create({
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
    },
      { transaction: t }
    );

    await createListingEvent({
      listing_id: listing.listing_id,
      event_type: 'CREATED',
      actor_org_code: null, // SYSTEM / REGISTRY
      event_data: {
        price_per_credit: listing.price_per_credit,
        credits_available: listing.credits_available,
        source: 'registry',
      },
      transaction: t,
    });

    await t.commit();
    return listing;

  } catch (error) {
    await t.rollback();
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

const getAllActiveListingsService = async () => {
  return await Listing.findAll({
    where: { status: 'open' },
    order: [['createdAt', 'DESC']],
  });
};

const getAllClosedListingsService = async () => {
  return await Listing.findAll({
    where: { status: 'closed' },
    order: [['updatedAt', 'DESC']],
  });
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

const getOrgActiveListingsService = async (org_id) => {
  if (!org_id) throw new Error('Org not found in session');

  return await Listing.findAll({
    where: {
      seller_id: org_id,
      status: 'open',
    },
    order: [['createdAt', 'DESC']],
  });
};

const getOrgClosedListingsService = async (org_id) => {
  if (!org_id) throw new Error('Org not found in session');

  return await Listing.findAll({
    where: {
      seller_id: org_id,
      status: 'closed',
    },
    order: [['updatedAt', 'DESC']],
  });
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

async function editListingService({
  listing_id,
  org_id,
  new_price,
  new_quantity
}) {
  if (!listing_id) throw new Error('Missing listing_id');

  const t = await sequelize.transaction();

  try {
    const listing = await Listing.findByPk(listing_id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!listing) throw new Error('Listing not found');
    if (listing.status !== 'open') throw new Error('Listing is not editable');

    if (!listing.seller_id)
      throw new Error('Registry listings cannot be edited');

    if (listing.seller_id !== org_id)
      throw new Error('Unauthorized listing edit');

    // Validate inputs
    const updates = {};
    const eventData = {};

    if (new_price !== undefined) {
      const price = parseFloat(new_price);
      if (isNaN(price) || price <= 0)
        throw new Error('Invalid price');

      if (price !== parseFloat(listing.price_per_credit)) {
        updates.price_per_credit = price;
        eventData.price_per_credit = price;
      }
    }

    if (new_quantity !== undefined) {
      const qty = parseFloat(new_quantity);
      if (isNaN(qty) || qty <= 0)
        throw new Error('Invalid quantity');

      const delta = qty - parseFloat(listing.credits_available);

      if (delta !== 0) {
        const holding = await Holdings.findOne({
          where: {
            org_id,
            project_id: listing.project_id
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (!holding) throw new Error('Holdings not found');

        const available =
          parseFloat(holding.credit_balance) -
          parseFloat(holding.locked_for_sale);

        if (delta > 0 && available < delta)
          throw new Error('Insufficient credits to increase listing');

        // Adjust holdings
        holding.locked_for_sale =
          parseFloat(holding.locked_for_sale) + delta;

        if (holding.locked_for_sale < 0)
          throw new Error('Invalid locked_for_sale state');

        await holding.save({ transaction: t });

        updates.credits_available = qty;
        eventData.quantity_change = delta;
        eventData.new_credits_available = qty;
      }
    }

    if (Object.keys(updates).length === 0)
      throw new Error('No valid changes provided');

    await listing.update(updates, { transaction: t });

    // Resolve org_code
    const org = await Org.findByPk(org_id, {
      attributes: ['org_code'],
      transaction: t
    });

    // Emit UPDATED event
    await createListingEvent({
      listing_id: listing.listing_id,
      event_type: 'UPDATED',
      actor_org_code: org.org_code,
      event_data: eventData,
      transaction: t
    });

    await t.commit();
    return listing;

  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function cancelListingService(listing_id, org_id) {
  const t = await sequelize.transaction();

  try {
    const listing = await Listing.findByPk(listing_id, {
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!listing) throw new Error('Listing not found');
    if (listing.status !== 'open') throw new Error('Listing is not open');
    if (!listing.seller_id) throw new Error('Registry listings cannot be cancelled');
    if (listing.seller_id !== org_id) throw new Error('Unauthorized');

    const holding = await Holdings.findOne({
      where: { org_id, project_id: listing.project_id },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!holding) throw new Error('Holdings not found');

    // Unlock remaining credits
    holding.locked_for_sale =
      parseFloat(holding.locked_for_sale) -
      parseFloat(listing.credits_available);

    if (holding.locked_for_sale < 0)
      throw new Error('Invalid locked state');

    await holding.save({ transaction: t });

    listing.status = 'closed';
    await listing.save({ transaction: t });

    const org = await Org.findByPk(org_id, {
      attributes: ['org_code'],
      transaction: t
    });

    await createListingEvent({
      listing_id,
      event_type: 'CANCELLED',
      actor_org_code: org.org_code,
      event_data: {
        remaining_credits: listing.credits_available
      },
      transaction: t
    });

    await t.commit();
    return listing;

  } catch (err) {
    await t.rollback();
    throw err;
  }
}

module.exports = {
  createListingService: withLogging(createListingService, 'createListingService'),
  getAllListingsService: withLogging(getAllListingsService, 'getAllListingsService'),
  getOrgListingsService: withLogging(getOrgListingsService, 'getOrgListingsService'),
  getListingByIdService: withLogging(getListingByIdService, 'getListingByIdService'),
  getAllActiveListingsService: withLogging(getAllActiveListingsService, 'getAllActiveListingsService'),
  getAllClosedListingsService: withLogging(getAllClosedListingsService, 'getAllClosedListingsService'),
  getOrgActiveListingsService: withLogging(getOrgActiveListingsService, 'getOrgActiveListingsService'),
  getOrgClosedListingsService: withLogging(getOrgClosedListingsService, 'getOrgClosedListingsService'),
  editListingService: withLogging(editListingService, 'editListingService'),
  cancelListingService: withLogging(cancelListingService, 'cancelListingService'),
};