const ListingEvent = require('./listingEventsModel');
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

module.exports = {
  createListingEvent: withLogging(createListingEvent, 'createListingEvent'),
};
