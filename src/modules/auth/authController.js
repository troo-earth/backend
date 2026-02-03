const { loginUserService, verifyUserService, logoutUserService } = require('./authService');
const { withLogging } = require('../../utils/logger');
const sessionManager = require('../../utils/sessionManager');
const { Role } = require('../../models/associations');

async function loginUserController(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.error('Email and password are required', 400);
    }

    // Call the service to authenticate and get the user
    const user = await loginUserService({ email, password });

    // Always fetch role details from Roles table using role_id with Sequelize
    let role_name = null;
    if (user && user.role_id) {
      try {
        const role = await Role.findByPk(user.role_id, {
          attributes: ['role_name']
        });
        if (role && role.role_name) {
          role_name = role.role_name;
        }
      } catch (e) {
        console.error('Error fetching role details during login', e && e.message ? e.message : e);
      }
    }

    // IMPORTANT: rotate session ID and persist session mapping in Redis
    req.session.regenerate((err) => {
      if (err) return next(err);

      // Attach identity to session with role details fetched from Roles table
      req.session.user = {
        user_id: user.user_id,
        fullname: user.fullname,
        email: user.email,
        role_id: user.role_id,
        role_name: role_name, // Fetched from Roles table, not stored in Users
        org_id: user.org_id,
      };

      // Track this session id for the user so we can invalidate later if needed
      try {
        sessionManager.addSessionForUser(user.user_id, req.sessionID).catch((e) => {
          console.error('Failed to register session for user', e && e.message ? e.message : e);
        });
      } catch (e) {
        console.error('Failed to call sessionManager.addSessionForUser', e && e.message ? e.message : e);
      }

      return res.success('Login successful', {
        user: req.session.user,
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

    // Attempt to remove this session from the user's session set first
    try {
      const user = req.session.user;
      if (user && user.user_id) {
        await sessionManager.removeSessionForUser(user.user_id, req.sessionID);
      }
    } catch (e) {
      console.error('Failed to remove session mapping during logout', e && e.message ? e.message : e);
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