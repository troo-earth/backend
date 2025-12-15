const express = require('express');
const bcrypt = require('bcrypt');
const {
  createUserController,
  updateUserController,
  viewUserController,
  loginUserController,
  verifyUserController,
  logoutUserController,
} = require('./userController');
const User = require('./userModel'); // Assuming this exports the User model directly

const router = express.Router();

router.post('/create-user', createUserController);       // Create user
router.put('/update-user/:id', updateUserController);     // Update user by ID
router.get('/view-user/:id', viewUserController); 
router.post('/login', loginUserController);        
router.get('/verify', verifyUserController);
router.delete('/logout', logoutUserController);

module.exports = router;