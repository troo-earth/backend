const express = require('express');
const {createProjectSellerController, getAllProjectsSellerController, sellerProfileController, findProjectByIdSellerController} = require("./sellerController");

const router  = express.Router();

router.post("/:id/projects", createProjectSellerController)
router.get("/:id/projects", getAllProjectsSellerController)
router.get("/:id/projects/:projectId", findProjectByIdSellerController)
router.get(":id", sellerProfileController)

module.exports = router;