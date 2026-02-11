const {
  createUserService,
  updateUserService,
  viewUserService,
  updateUserRoleService,
  removeUserFromOrgService,
} = require("./userService");
const { withLogging } = require("../../utils/logger");
const { validate: uuidValidate } = require("uuid");
const redisClient = require("../../config/redis");

async function createUserController(req, res, next) {
  try {
    const { user_name, email, password, fullname } = req.body || {};

    if (!user_name || !email || !password || !fullname) {
      return res.error("Missing required fields", 400);
    }

    const user = await createUserService({
      user_name,
      email,
      password,
      fullname,
    });

    const { password_hash, ...safeUser } = user.toJSON ? user.toJSON() : user;

    // Rotate session and set identity
    req.session.regenerate(async (err) => {
      if (err) return next(err);

      req.session.user = {
        user_id: user.user_id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        org_id: user.org_id,
      };

      // Track session in Redis
      await redisClient.sAdd(`user_sessions:${user.user_id}`, req.sessionID);

      return res.success(
        "User created successfully",
        {
          user: safeUser,
        },
        201,
      );
    });
  } catch (error) {
    const statusMap = {
      "Invalid email format": 400,
      "Invalid password format": 400,
      "Email already registered": 409,
      "Username already registered": 409,
      "Full name is required and must be a non-empty string": 400,
      "Full name contains invalid characters": 400,
      "Username is required and must be a non-empty string": 400,
    };

    const status = statusMap[error.message] || 500;

    if (status !== 500) {
      return res.error(error.message, status);
    }

    next(error);
  }
}

async function updateUserController(req, res, next) {
  try {
    const user_id = req.params.id;
    const updateFields = req.body || {};

    // Validate user_id
    if (!user_id || !uuidValidate(user_id)) {
      return res.error("Invalid user ID format (must be a valid UUID)", 400);
    }

    const user = await updateUserService(user_id, updateFields);

    // Sanitize response
    const { password_hash, ...safeUser } = user.toJSON ? user.toJSON() : user;

    return res.success("User updated successfully", { user: safeUser });
  } catch (error) {
    const statusMap = {
      "Missing user ID": 400,
      "Missing update fields": 400,
      "No valid update fields provided": 400,
      "Invalid email format": 400,
      "Invalid password format": 400,
      "Invalid org_id": 400, // ✅ NEW
      "Email already registered": 409,
      "Username already registered": 409,
      "Full name must be a non-empty string": 400,
      "Full name contains invalid characters": 400,
      "User not found": 404,
    };

    const status = statusMap[error.message] || 500;

    if (status !== 500) {
      return res.error(error.message, status);
    }

    next(error);
  }
}

async function viewUserController(req, res, next) {
  try {
    const user_id = req.params.id;

    const user = await viewUserService(user_id);

    // Sanitize response
    const { password_hash, ...safeUser } = user.toJSON ? user.toJSON() : user;

    return res.success("User found", { user: safeUser });
  } catch (error) {
    const statusMap = {
      "Missing user ID": 400,
      "User not found": 404,
    };

    const status = statusMap[error.message] || 500;
    if (status !== 500) {
      return res.error(error.message, status);
    }

    next(error);
  }
}

const updateUserRoleController = async (req, res, next) => {
  try {
    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.error("user_id and role are required", 400);
    }

    const actor = req.session.user;

    const updatedUser = await updateUserRoleService({
      actorUserId: actor.user_id,
      actorRole: actor.role,
      targetUserId: user_id,
      targetRole: role,
      org_id: actor.org_id,
    });

    return res.success("User role updated successfully", {
      user: updatedUser,
    });
  } catch (error) {
    return res.error(error.message || "Failed to update role", 400);
  }
};

const removeUserFromOrgController = async (req, res, next) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.error("user_id is required", 400);
    }

    if (!user_id || !uuidValidate(user_id)) {
      return res.error("Invalid user ID format (must be a valid UUID)", 400);
    }

    const actor = req.session.user;

    await removeUserFromOrgService({
      actorUserId: actor.user_id,
      actorRole: actor.role,
      targetUserId: user_id,
      org_id: actor.org_id,
    });

    return res.success("User removed from organization");
  } catch (err) {
    if (err.message) return res.error(err.message, 400);
    next(err);
  }
};

module.exports = {
  createUserController: withLogging(
    createUserController,
    "createUserController",
  ),
  updateUserController: withLogging(
    updateUserController,
    "updateUserController",
  ),
  viewUserController: withLogging(viewUserController, "viewUserController"),
  updateUserRoleController: withLogging(
    updateUserRoleController,
    "updateUserRoleController",
  ),
  removeUserFromOrgController: withLogging(
    removeUserFromOrgController,
    "removeUserFromOrgController",
  ),
};
