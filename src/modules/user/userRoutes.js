const express = require('express');
const {
  createUserController,
  updateUserController,
  viewUserController,
  deleteAccountController,
} = require('./userController');

const router = express.Router();

router.post('/create-user', createUserController);       
router.put('/update-user/:id', updateUserController);     
router.get('/view-user/:id', viewUserController);        
router.delete('/delete-account', deleteAccountController);

module.exports = router;