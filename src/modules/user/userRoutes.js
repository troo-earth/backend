const express = require('express');
const {
  createUserController,
  updateUserController,
} = require('./userController');

const router = express.Router();

router.post('/', createUserController);       // Create user
router.put('/:id', updateUserController);     // Update user by ID

module.exports = router;
