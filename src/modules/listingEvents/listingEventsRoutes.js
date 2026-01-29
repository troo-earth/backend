const express = require('express');
const {
    getOrgListingEventsController
} = require('./listingEventsController');

const router = express.Router();

router.get('/get-org-listing-events', getOrgListingEventsController);

module.exports = router;
