const {getAllProjectsController, findProjectByIdController} = require("./projectController");
const {findProjectByIdSellerController} = require("../seller/sellerController");
const router = require('express').Router();

router.get('/', getAllProjectsController);
router.get('/:id', findProjectByIdController);
// router.post('/:id/upload-docs', uploadProjectDocsController);

module.exports = router;