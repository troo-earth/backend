const { createUserService, updateUserService } = require('./userService');
const { withLogging } = require('../../utils/logger');

// Create user route
async function createUserController(req, res, next) {
  try {
    if (!req.body) {
      return res.error('Missing request body', 400);
    }
    const { user_name, email, password } = req.body;

    if (!user_name || !email || !password) {
      return res.error('Missing request fields', 400);
    }
    const user = await createUserService({ user_name, email, password });
    return res.success('User created successfully', user);

  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.error(error.message, 409);
    } else if (error.message === 'Invalid email format') {
      return res.error(error.message, 400);
    } else if (error.message === 'Invalid password format') {
      return res.error(error.message, 400);
    } else if (error.message === 'Username already registered') {
      return res.error(error.message, 409);
    }
    next(error);
  }
}

async function updateUserController(req, res, next) {
  let statusCode = 500;
  try {
    const user_id = req.params.id;
    const updateFields = req.body;
    const user = await updateUserService(user_id, updateFields);
    return res.success('User updated successfully', user);
  } catch (error) {
    switch (error.message) {
      case 'Missing user ID':
      case 'Missing update fields':
      case 'No valid update fields provided':
      case 'Invalid email format':
        statusCode = 400;
        break;
      case 'User not found':
        statusCode = 404;
        break;
      case 'Email already registered':
      case 'Username already registered':
        statusCode = 409;
        break;
    }
    if (statusCode !== 500) {
      return res.error(error.message, statusCode);
    } else {
      next(error);
    }
  }
}

module.exports = {
  createUserController: withLogging(createUserController, 'createUserController'),
  updateUserController: withLogging(updateUserController, 'updateUserController'),
};
