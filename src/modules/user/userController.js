const { createUserService, updateUserService, viewUserService } = require('./userService');
const { withLogging } = require('../../utils/logger');
const { validate: uuidValidate } = require('uuid');

async function createUserController(req, res, next) {
  try {
    const { user_name, email, password, fullname } = req.body || {};

    // Basic HTTP-level check for required fields
    if (!user_name || !email || !password || !fullname) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await createUserService({ user_name, email, password, fullname });

    // Sanitize response (remove sensitive data)
    const { password_hash, ...safeUser } = user.toJSON ? user.toJSON() : user;

    return res.status(201).json({ success: true, message: 'User created successfully', data: safeUser });
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
      return res.status(status).json({ success: false, message: error.message });
    }
    next(error);  // Pass unexpected errors to global handler
  }
}

async function updateUserController(req, res, next) {
  try {
    const user_id = req.params.id;
    const updateFields = req.body || {};

    // Validate user_id as UUID
    if (!user_id || !uuidValidate(user_id)) {  // Or regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user_id)
      return res.status(400).json({ success: false, message: 'Invalid user ID format (must be a valid UUID)' });
    }
    const user = await updateUserService(user_id, updateFields);

    // Sanitize response
    const { password_hash, ...safeUser } = user.toJSON ? user.toJSON() : user;

    return res.status(200).json({ success: true, message: 'User updated successfully', data: safeUser });
  } catch (error) {
    const statusMap = {
      'Missing user ID': 400,
      'Missing update fields': 400,
      'No valid update fields provided': 400,
      'Invalid email format': 400,
      'Invalid password format': 400,
      'Email already registered': 409,
      'Username already registered': 409,
      'Full name must be a non-empty string': 400,
      'Full name contains invalid characters': 400,
      'User not found': 404,
    };

    const status = statusMap[error.message] || 500;
    if (status !== 500) {
      return res.status(status).json({ success: false, message: error.message });
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

module.exports = {
  createUserController: withLogging(createUserController, 'createUserController'),
  updateUserController: withLogging(updateUserController, 'updateUserController'),
  viewUserController: withLogging(viewUserController, 'viewUserController'),
};