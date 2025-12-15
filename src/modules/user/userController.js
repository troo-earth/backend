const {
  createUserService,
  updateUserService,
  viewUserService, 
  loginUserService, 
  verifyUserService, 
  logoutUserService,
 } = require('./userService');
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

async function viewUserController(req, res, next) {
  try {
    const user_id = req.params.id;
    const user = await viewUserService(user_id);
    return res.success('User found', user);
  } catch (error) {
    if (error.message === 'Missing user ID') {
      return res.error(error.message, 400);
    }
    if (error.message === 'User not found') {
      return res.error(error.message, 404);
    }
    next(error); // Unexpected errors
  }
}

async function loginUserController(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.error('Email and password are required', 400);
    }

    // Call the service to authenticate and get the user
    const user = await loginUserService({ email, password });

    console.log('Login successful for user:', { id: user.user_id, email: user.email });

    // Set session data
    req.session.user = {
      id: user.user_id,
      email: user.email,
      name: user.user_name,
    };

    await req.session.save();

    // Respond with success
    return res.success('Login successful', {
      user: req.session.user,
    });

  } catch (error) {
    // Specific handling for authentication errors
    if (error.message === 'Email and password are required' ||
      error.message === 'Invalid email or password') {
      return res.error('Invalid email or password', 401);
    }

    // Log unexpected errors and pass to error handler
    console.error('Login error:', error);
    next(error);
  }
}

async function verifyUserController(req, res, next) {
  try {
    const user = await verifyUserService(req.session.user);
    return res.success('Authenticated', { user });
  } catch (error) {
    if (error.message === 'Not authenticated') {
      return res.error('Not authenticated', 401);
    }
    next(error);
  }
}

async function logoutUserController(req, res, next) {
  try {
    await logoutUserService(); // keeps pattern consistent

    if (!req.session || !req.session.user) {
      return res.success('Logged out successfully');
    }

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      return res.success('Logged out successfully');
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUserController: withLogging(createUserController, 'createUserController'),
  updateUserController: withLogging(updateUserController, 'updateUserController'),
  viewUserController: withLogging(viewUserController, 'viewUserController'),
  loginUserController: withLogging(loginUserController, 'loginUserController'),
  verifyUserController: withLogging(verifyUserController, 'verifyUserController'),
  logoutUserController: withLogging(logoutUserController, 'logoutUserController'),
};
