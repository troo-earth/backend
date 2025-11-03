const { createUser, updateUser } = require('./userService');

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

    const user = await createUser({ user_name, email, password});
    return res.success('User created successfully', user);

  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.error(error.message, 409);
    } else if (error.message === 'Invalid email format') {
      return res.error(error.message, 400);
    } else if (error.message === 'Invalid password format') {
      return res.error(error.message, 400);
    }
    next(error);
  }
}

// Update user route
async function updateUserController(req, res, next) {
  try {
    const user_id = req.params.id;
    const updateFields = req.body;
    const user = await updateUser(user_id, updateFields);
    res.success('User updated successfully', user);
  } catch (error) {
    next(error);
  }
}

module.exports = { createUserController, updateUserController };
