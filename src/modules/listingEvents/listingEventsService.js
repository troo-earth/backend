const ListingEvent = require('./listingEventsModel');
const Org = require('../org/orgModel');
const { withLogging } = require('../../utils/logger');

async function createListingEvent({
  listing_id,
  event_type,
  event_data,
  actor_org_code,
  transaction,
}) {
  return ListingEvent.create(
    {
      listing_id,
      event_type,
      event_data,
      actor_org_code,
    },
    { transaction }
  );
}

const getOrgListingEventsService = async (org_id) => {
  if (!org_id) {
    const err = new Error('Organization ID is required');
    err.statusCode = 400;
    throw err;
  }

  // 1. Resolve org_code from org_id
  const org = await Org.findByPk(org_id, {
    attributes: ['org_code'],
  });

  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Fetch listing events by actor_org_code
  const events = await ListingEvent.findAll({
    where: {
      actor_org_code: org.org_code,
    },
    order: [['createdAt', 'ASC']],
  });

  return events;
};

module.exports = {
  createListingEvent: withLogging(createListingEvent, 'createListingEvent'),
  getOrgListingEventsService: withLogging(getOrgListingEventsService, 'getOrgListingEventsService'),
};
