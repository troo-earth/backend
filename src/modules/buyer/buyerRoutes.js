// routes/buyerRoutes.js
const express = require('express');
const {
  getBuyerByUserIdController,
  getBuyerByTypeController,
} = require('./buyerController');

const router = express.Router();

// Note: For auth, you can replace param usage with middleware that populates req.user
router.get('/user/:userId', getBuyerByUserIdController); // GET buyer details by user id
router.get('/type/:buyerType', getBuyerByTypeController); // GET buyers by type

module.exports = router;
