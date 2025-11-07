const express = require('express');
const {
  createUserController,
  updateUserController,
  viewUserController,
} = require('./userController');

const router = express.Router();

router.post('/create-user', createUserController);       // Create user
router.put('/update-user/:id', updateUserController);     // Update user by ID
router.get('/view-user/:id', viewUserController);     // View user by ID

module.exports = router;
