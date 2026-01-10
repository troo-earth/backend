const express = require('express');
const {
  createUserController,
  updateUserController,
  viewUserController,
} = require('./userController');

const router = express.Router();

router.post('/create-user', createUserController);       
router.put('/update-user/:id', updateUserController);     
router.get('/view-user/:id', viewUserController);        

module.exports = router;