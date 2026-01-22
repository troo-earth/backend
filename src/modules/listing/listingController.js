const { createListingService, getAllListingsService, getOrgListingsService, getListingByIdService } = require('./listingService');
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

module.exports = {
  createListingController: withLogging(createListingController, 'createListingController'),
  getAllListingsController: withLogging(getAllListingsController, 'getAllListingsController'),
  getOrgListingsController: withLogging(getOrgListingsController, 'getOrgListingsController'),
  getListingByIdController: withLogging(getListingByIdController, 'getListingByIdController'),
};