const express = require('express');
const router = express.Router();
const { checkInvitationTokenController } = require('./invitationController');

router.post('/check-token', checkInvitationTokenController);

module.exports = router;
