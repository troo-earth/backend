const express = require('express');
const {
  inviteMemberController,
  viewMembersController,
  assignRoleController,
  removeMemberController,
} = require('./orgUserController');

const router = express.Router();

router.post('/invite', inviteMemberController);                 
router.get('/view/:org_id', viewMembersController);             
router.put('/assign-role', assignRoleController);               
router.delete('/remove/:org_user_id', removeMemberController);  

module.exports = router;
