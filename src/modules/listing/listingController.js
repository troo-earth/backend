const {
  createListingService,
  getAllListingsService,
  getOrgListingsService,
  getListingByIdService,
  getAllActiveListingsService,
  getAllClosedListingsService,
  getOrgActiveListingsService,
  getOrgClosedListingsService,
  editListingService,
  cancelListingService
} = require('./listingService');
const { withLogging } = require('../../utils/logger');
const { validate: uuidValidate } = require('uuid');

const createListingController = async (req, res) => {
  try {
    const listingData = req.body;

    // Basic validation (expand as needed)
    const requiredFields = [
      'project_id',
      'credits_available',
      'price_per_credit',
      'project_name',
      'project_start_year',
      'registry',
      'category',
      'location_city',
      'location_state',
      'location_country',
      'thumbnail_url',
      'methodology'
    ];
    for (const field of requiredFields) {
      if (!listingData[field]) {
        return res.status(400).json({ success: false, message: `Missing required field: ${field}` });
      }
    }

    const newListing = await createListingService(listingData);
    return res.status(201).json({ success: true, message: 'Listing created successfully', data: newListing });
  } catch (error) {
    const statusMap = {
      'Failed to create listing': 500, // Adjust based on specific error messages from service
      // Add more as needed from service errors
    };

    const status = statusMap[error.message] || 500;
    if (status !== 500) {
      return res.status(status).json({ success: false, message: error.message });
    }
    console.error('Error creating listing:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAllListingsController = async (req, res) => {
  try {
    const listings = await getAllListingsService();
    return res.status(200).json({ success: true, message: 'Listings fetched successfully', data: listings });
  } catch (error) {
    const statusMap = {
      'Failed to fetch listings': 500,
      // Add more as needed
    };

    const status = statusMap[error.message] || 500;
    if (status !== 500) {
      return res.status(status).json({ success: false, message: error.message });
    }
    console.error('Error fetching listings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAllActiveListingsController = async (req, res, next) => {
  try {
    const listings = await getAllActiveListingsService();
    return res.success('Active listings fetched', listings);
  } catch (err) {
    next(err);
  }
};

const getAllClosedListingsController = async (req, res, next) => {
  try {
    const listings = await getAllClosedListingsService();
    return res.success('Closed listings fetched', listings);
  } catch (err) {
    next(err);
  }
};

const getOrgListingsController = async (req, res, next) => {
  try {
    const org_id = req.session?.user?.org_id;

    // User logged in but not linked to org
    if (!org_id) {
      return res.error(
        'User is not associated with any organization',
        403
      );
    }

    const result = await getOrgListingsService(org_id);

    if (result.error) {
      return res.error(result.error, result.statusCode);
    }

    // Empty array is valid
    return res.success(
      'Organization listings fetched successfully',
      result.data
    );

  } catch (error) {
    next(error);
  }
};

const getOrgActiveListingsController = async (req, res, next) => {
  try {
    const org_id = req.session.user?.org_id;
    if (!org_id) return res.error('User not linked to org', 403);

    const listings = await getOrgActiveListingsService(org_id);
    return res.success('Active org listings fetched', listings);
  } catch (err) {
    next(err);
  }
};

const getOrgClosedListingsController = async (req, res, next) => {
  try {
    const org_id = req.session.user?.org_id;
    if (!org_id) return res.error('User not linked to org', 403);

    const listings = await getOrgClosedListingsService(org_id);
    return res.success('Closed org listings fetched', listings);
  } catch (err) {
    next(err);
  }
};


async function getListingByIdController(req, res, next) {
  try {
    const { listing_id } = req.params;

    if (!listing_id) {
      return res.error('listing_id is required', 400);
    }

    if (!uuidValidate(listing_id)) {
      return res.error('Invalid listing_id format', 400);
    }

    const result = await getListingByIdService(listing_id);

    if (result.error) {
      return res.error(result.error, result.statusCode);
    }

    return res.success(
      'Listing fetched successfully',
      result.data
    );

  } catch (error) {
    next(error);
  }
}

async function editListingController(req, res, next) {
  try {

    if (!req.body?.listing_id || !req.body?.price || !req.body?.quantity) {
      return res.error("listing_id, price and quantity are required", 400);
    }

    const { listing_id, price, quantity } = req.body;
    const org_id = req.session.user?.org_id;

    if (!org_id)
      return res.error('User is not associated with an organization', 403);

    if (!listing_id || !uuidValidate(listing_id))
      return res.error('Invalid listing_id', 400);

    const result = await editListingService({
      listing_id,
      org_id,
      new_price: price,
      new_quantity: quantity
    });

    return res.success(
      'Listing updated successfully',
      result
    );

  } catch (error) {
    const statusMap = {
      'Missing listing_id': 400,
      'Invalid listing_id': 400,
      'Invalid price': 400,
      'Invalid quantity': 400,
      'No valid changes provided': 400,
      'Listing not found': 404,
      'Listing is not editable': 400,
      'Unauthorized listing edit': 403,
      'Registry listings cannot be edited by User': 403,
      'Insufficient credits to increase listing': 400,
      'Holdings not found': 404,
    };

    const status = statusMap[error.message];
    if (status) return res.error(error.message, status);

    next(error);
  }
}

async function cancelListingController(req, res, next) {
  try {
    const { listing_id } = req.body;
    const org_id = req.session.user?.org_id;

    if (!org_id)
      return res.error('User not associated with organization', 403);

    if (!listing_id || !uuidValidate(listing_id))
      return res.error('Invalid listing_id', 400);

    const result = await cancelListingService(listing_id, org_id);

    return res.success('Listing cancelled successfully', result);

  } catch (error) {
    const statusMap = {
      'Listing not found': 404,
      'Listing is not open': 400,
      'Registry listings cannot be cancelled': 403,
      'Unauthorized': 403,
      'Holdings not found': 404,
    };

    const status = statusMap[error.message];
    if (status) return res.error(error.message, status);

    next(error);
  }
}

module.exports = {
  createListingController: withLogging(createListingController, 'createListingController'),
  getAllListingsController: withLogging(getAllListingsController, 'getAllListingsController'),
  getOrgListingsController: withLogging(getOrgListingsController, 'getOrgListingsController'),
  getListingByIdController: withLogging(getListingByIdController, 'getListingByIdController'),
  getAllActiveListingsController: withLogging(getAllActiveListingsController, 'getAllActiveListingsController'),
  getAllClosedListingsController: withLogging(getAllClosedListingsController, 'getAllClosedListingsController'),
  getOrgActiveListingsController: withLogging(getOrgActiveListingsController, 'getOrgActiveListingsController'),
  getOrgClosedListingsController: withLogging(getOrgClosedListingsController, 'getOrgClosedListingsController'),
  editListingController: withLogging(editListingController, 'editListingController'),
  cancelListingController: withLogging(cancelListingController, 'cancelListingController'),
};