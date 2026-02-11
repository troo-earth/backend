const express = require("express");
const {
  createUserController,
  updateUserController,
  viewUserController,
  updateUserRoleController,
  removeUserFromOrgController,
} = require("./userController");
const authorizePermission = require("../../middleware/authorizePermission");
const { PERMISSIONS } = require("../../constants/permissions");

const router = express.Router();

router.post("/create-user", createUserController);
router.put("/update-user/:id", updateUserController);
router.get("/view-user/:id", viewUserController);
router.patch(
  "/update-role",
  authorizePermission(PERMISSIONS.ASSIGN_ROLE),
  updateUserRoleController,
);
router.delete(
  "/remove-user",
  authorizePermission(PERMISSIONS.REMOVE_USER),
  removeUserFromOrgController,
);

module.exports = router;
