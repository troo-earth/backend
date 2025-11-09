const {getAllProjectsController, findProjectByIdController} = require("./projectController");
const router = require('express').Router();

router.get('/', getAllProjectsController);
router.get('/:id', findProjectByIdController);
// router.post('/:id/upload-docs', uploadProjectDocsController);

module.exports = router;