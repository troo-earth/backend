const { createUserService, updateUserService, viewUserService, updateUserRoleService } = require('./userService');
const { withLogging } = require('../../utils/logger');
const { validate: uuidValidate } = require('uuid');

async function createUserController(req, res, next) {
  try {
    const { user_name, email, password, fullname } = req.body || {};

    if (!user_name || !email || !password || !fullname) {
      return res.error('Missing required fields', 400);
    }

    const user = await createUserService({
      user_name,
      email,
      password,
      fullname,
    });

    const { password_hash, ...safeUser } =
      user.toJSON ? user.toJSON() : user;

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
      await redisClient.sAdd(
        `user_sessions:${user.user_id}`,
        req.sessionID
      );

      return res.success('User created successfully', {
        user: safeUser,
      }, 201);
    });

  } catch (error) {
    const statusMap = {
      'Invalid email format': 400,
      'Invalid password format': 400,
      'Email already registered': 409,
      'Username already registered': 409,
      'Full name is required and must be a non-empty string': 400,
      'Full name contains invalid characters': 400,
      'Username is required and must be a non-empty string': 400,
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
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format (must be a valid UUID)',
      });
    }

    const user = await updateUserService(user_id, updateFields);

    // Sanitize response
    const { password_hash, ...safeUser } =
      user.toJSON ? user.toJSON() : user;

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: safeUser,
    });

  } catch (error) {
    const statusMap = {
      'Missing user ID': 400,
      'Missing update fields': 400,
      'No valid update fields provided': 400,
      'Invalid email format': 400,
      'Invalid password format': 400,
      'Invalid org_id': 400,              // ✅ NEW
      'Email already registered': 409,
      'Username already registered': 409,
      'Full name must be a non-empty string': 400,
      'Full name contains invalid characters': 400,
      'User not found': 404,
    };

    const status = statusMap[error.message] || 500;

    if (status !== 500) {
      return res.status(status).json({
        success: false,
        message: error.message,
      });
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

    return res.status(200).json({ success: true, message: 'User found', data: safeUser });
  } catch (error) {
    const statusMap = {
      'Missing user ID': 400,
      'User not found': 404,
    };

    const status = statusMap[error.message] || 500;
    if (status !== 500) {
      return res.status(status).json({ success: false, message: error.message });
    }
    next(error);
  }
}

const updateUserRoleController = async (req, res, next) => {
  try {
    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.error('user_id and role are required', 400);
    }

    const actor = req.session.user;

    const updatedUser = await updateUserRoleService({
      actorUserId: actor.user_id,
      actorRole: actor.role,
      targetUserId: user_id,
      newRole: role,
      org_id: actor.org_id,
    });

    return res.success('User role updated successfully', {
      user: updatedUser,
    });

  } catch (error) {
    return res.error(error.message || 'Failed to update role', 400);
  }
};

module.exports = {
  createUserController: withLogging(createUserController, 'createUserController'),
  updateUserController: withLogging(updateUserController, 'updateUserController'),
  viewUserController: withLogging(viewUserController, 'viewUserController'),
  updateUserRoleController: withLogging(updateUserRoleController, 'updateUserRoleController'),
};