const {createProjectController} = require("./projectController");
const router = require('express').Router();

router.post('/', createProjectController);

module.exports = router;