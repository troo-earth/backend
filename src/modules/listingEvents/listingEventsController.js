const { getOrgListingEventsService } = require('./listingEventsService');
const { withLogging } = require('../../utils/logger');

const getOrgListingEventsController = async (req, res) => {
  try {
    const sessionUser = req.session?.user;

    if (!sessionUser || !sessionUser.org_id) {
      return res.error('User is not associated with any organization', 401);
    }

    const events = await getOrgListingEventsService(sessionUser.org_id);

    return res.success(
      'Listing events fetched successfully',
      { events }
    );
  } catch (error) {
    return res.error(
      error.message || 'Failed to fetch listing events',
      error.statusCode || 500
    );
  }
};

module.exports = {
  getOrgListingEventsController: withLogging(getOrgListingEventsController, 'getOrgListingEventsController'),
};
