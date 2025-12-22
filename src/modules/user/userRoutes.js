const express = require('express');
const {
  createUserController,
  updateUserController,
  viewUserController,
} = require('./userController');

const router = express.Router();

router.post('/create-user', createUserController);       // Public (registration)
router.put('/update-user/:id', updateUserController);     // Protected
router.get('/view-user/:id', viewUserController);         // Protected

module.exports = router;