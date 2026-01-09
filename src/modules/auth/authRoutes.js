const express = require('express');
const {
  loginUserController,
  verifyUserController,
  logoutUserController,
} = require('./authController');

const router = express.Router();

router.post('/login', loginUserController);      
router.get('/me', verifyUserController);
router.delete('/logout', logoutUserController);

module.exports = router;