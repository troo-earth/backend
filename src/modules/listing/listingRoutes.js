// src/modules/listing/listingRoutes.js
const express = require('express');
const {
    createListingController,
    getAllListingsController,
    getOrgListingsController,
    getListingByIdController
} = require('./listingController');

const router = express.Router();

// POST: Create a new listing
router.post('/create-listing', createListingController);

// GET: Fetch all listings
router.get('/get-all-listings', getAllListingsController);

// GET: Fetch listings for the organization associated with the logged-in user
router.get('/get-org-listings', getOrgListingsController);

// GET: Fetch a specific listing by ID
router.get('/get-listing/:listing_id', getListingByIdController);

module.exports = router;