const { loginUserService, verifyUserService, logoutUserService } = require('./authService');
const { withLogging } = require('../../utils/logger');
const sessionManager = require('../../utils/sessionManager');
const supabase = require('../../config/supabase');
const User = require('../user/userModel');

async function loginUserController(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.error('Email and password are required', 400);
    }

    // Call the service to authenticate and get the user
    const user = await loginUserService({ email, password });

    // If user has a role_id but no role_name, try to populate it from Supabase Roles
    try {
      if (user && user.role_id && !user.role_name) {
        const { data: roleRow, error: roleErr } = await supabase.from('Roles').select('role_name').eq('role_id', user.role_id).limit(1).maybeSingle();
        if (!roleErr && roleRow && roleRow.role_name) {
          // persist to Users table for easier reads later
          try {
            await User.update({ role_name: roleRow.role_name }, { where: { user_id: user.user_id } });
            // reflect on the returned user object for session
            user.role_name = roleRow.role_name;
          } catch (e) {
            console.error('Failed to persist role_name to Users table', e && e.message ? e.message : e);
          }
        }
      }
    } catch (e) {
      console.error('Error while normalizing user role_name from Supabase', e && e.message ? e.message : e);
    }

    // IMPORTANT: rotate session ID and persist session mapping in Redis
    req.session.regenerate((err) => {
      if (err) return next(err);

      // Attach identity to session
      req.session.user = {
        user_id: user.user_id,
        fullname: user.fullname,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
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