const { createUserService, updateUserService, viewUserService, deleteUserService } = require('./userService');
const { withLogging } = require('../../utils/logger');
const { validate: uuidValidate } = require('uuid');
const sessionManager = require('../../utils/sessionManager');
const User = require('./userModel');
const { Role } = require('../../models/associations');

async function createUserController(req, res, next) {
  try {
    const { user_name, email, password, fullname } = req.body || {};

    if (!user_name || !email || !password || !fullname) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const user = await createUserService({ user_name, email, password, fullname });

    const { password_hash, ...safeUser } =
      user.toJSON ? user.toJSON() : user;

    // Fetch role_name from Roles table using role_id (like login does)
    let role_name = null;
    if (user.role_id) {
      try {
        const role = await Role.findByPk(user.role_id, {
          attributes: ['role_name']
        });
        if (role && role.role_name) {
          role_name = role.role_name;
        }
      } catch (e) {
        console.error('Error fetching role details during user creation', e && e.message ? e.message : e);
      }
    }

    // 🔒 Rotate session + respond ONLY inside callback
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.user = {
        user_id: user.user_id,
        fullname: user.fullname,
        email: user.email,
        role_id: user.role_id,
        role_name: role_name, // Fetched from Roles table
        org_id: user.org_id
      };

      // Register the new session ID so it can be invalidated later if needed
      sessionManager.addSessionForUser(user.user_id, req.sessionID);
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: safeUser,
      });
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
      return res.status(status).json({
        success: false,
        message: error.message
      });
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

// Delete own account. If user is an ADMIN and the only admin in their org, disallow deletion
async function deleteAccountController(req, res, next) {
  try {
    const actor = req.session?.user;
    if (!actor) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const userId = actor.user_id;

    // Delegate deletion and sole-admin guard to service FIRST
    try {
      await deleteUserService(userId, actor); // Pass session data to avoid unnecessary DB query
    } catch (err) {
      if (err && (err.code === 'SOLE_ADMIN' || err.message === 'Sole admin')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete account: you are the only ADMIN in the organization. Invite another ADMIN or assign the ADMIN role to another user before deleting your account.'
        });
      }
      throw err;
    }

    // Only invalidate sessions AFTER successful deletion
    try {
      await sessionManager.invalidateSessionsForUser(userId);
    } catch (e) {
      console.error('Failed to invalidate sessions after user deletion', e && e.message ? e.message : e);
      // Don't fail the request if session invalidation fails - account is already deleted
    }

    // Destroy current session if present
    if (req.session) {
      req.session.destroy((err) => {
        // ignore destroy errors, still return success
        return res.status(200).json({ success: true, message: 'Account deleted successfully' });
      });
    } else {
      return res.status(200).json({ success: true, message: 'Account deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUserController: withLogging(createUserController, 'createUserController'),
  updateUserController: withLogging(updateUserController, 'updateUserController'),
  viewUserController: withLogging(viewUserController, 'viewUserController'),
  deleteAccountController: withLogging(deleteAccountController, 'deleteAccountController'),
};