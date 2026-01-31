// src/modules/listing/listingRoutes.js
const express = require('express');
const {
    createListingController,
    getAllListingsController,
    getOrgListingsController,
    getListingByIdController,
    getAllActiveListingsController,
    getAllClosedListingsController,
    getOrgActiveListingsController,
    getOrgClosedListingsController,
    editListingController,
    cancelListingController
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

// GET: Fetch all active listings
router.get('/get-all-active-listings', getAllActiveListingsController); 

// GET: Fetch all closed listings
router.get('/get-all-closed-listings', getAllClosedListingsController);

// GET: Fetch active listings for the organization associated with the logged-in user
router.get('/get-org-active-listings', getOrgActiveListingsController);

// GET: Fetch closed listings for the organization associated with the logged-in user
router.get('/get-org-closed-listings', getOrgClosedListingsController);

// PUT: Edit an existing listing
router.put('/edit-listing', editListingController);

// POST: Cancel a listing
router.post('/cancel-listing', cancelListingController);

module.exports = router;