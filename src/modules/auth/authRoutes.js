const express = require('express');
const {
  loginUserController,
  verifyUserController,
  logoutUserController,
} = require('./authController');

const router = express.Router();

router.post('/login', loginUserController);              // Public
router.get('/verify', verifyUserController); // Protected
router.delete('/logout', logoutUserController); // Protected

module.exports = router;