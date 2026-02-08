const express = require('express');
const {
  createUserController,
  updateUserController,
  viewUserController,
  updateUserRoleController,
} = require('./userController');

const router = express.Router();

router.post('/create-user', createUserController);
router.put('/update-user/:id', updateUserController);
router.get('/view-user/:id', viewUserController);
router.patch('/update-role',authorizePermission(PERMISSIONS.ASSIGN_ROLE), updateUserRoleController);

module.exports = router;