// src/modules/listing/listingRoutes.js
const express = require('express');
const { createListingController, getAllListingsController } = require('./listingController');

const router = express.Router();

// POST: Create a new listing
router.post('/create-listing', createListingController);

// GET: Fetch all listings
router.get('/get-all-listings', getAllListingsController);

module.exports = router;