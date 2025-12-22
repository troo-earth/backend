const { loginUserService, verifyUserService, logoutUserService } = require('./authService');
const { withLogging } = require('../../utils/logger');

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
      return res.success('Logged Out');
    }

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      return res.success('Logged out and Session Cleared Successfully');
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  loginUserController: withLogging(loginUserController, 'loginUserController'),
  verifyUserController: withLogging(verifyUserController, 'verifyUserController'),
  logoutUserController: withLogging(logoutUserController, 'logoutUserController'),
};