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

    // IMPORTANT: rotate session ID
    req.session.regenerate((err) => {
      if (err) return next(err);

      // Attach identity to session
      req.session.user = {
        user_id: user.user_id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,        
        org_id: user.org_id    
      };

      return res.success('Login successful', {
        user: req.session.user
      });
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

  await logoutUserService(); // currently a no-op, but keeps symmetry
  try {
    if (!req.session) {
      return res.success('Logged out');
    }

    req.session.destroy((err) => {
      if (err) return next(err);

      res.clearCookie('troo.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production'
          ? '.troo.earth'
          : undefined,
      });

      return res.success('Logged out successfully');
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