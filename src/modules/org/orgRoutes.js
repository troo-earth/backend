const express = require('express');
const { createOrgController, getOrgController } = require('./orgController');

const router = express.Router();

router.post('/create', createOrgController);
router.get('/:org_id', getOrgController);

module.exports = router;
