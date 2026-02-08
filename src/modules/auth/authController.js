const { loginUserService, verifyUserService, logoutUserService } = require('./authService');
const { withLogging } = require('../../utils/logger');
const redisClient = require('../../config/redis');

async function loginUserController(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.error('Email and password are required', 400);
    }

    // Call the service to authenticate and get the user
    const user = await loginUserService({ email, password });

    req.session.regenerate(async (err) => {
      if (err) return next(err);

      req.session.user = {
        user_id: user.user_id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        org_id: user.org_id
      };

      // Track session AFTER regenerate
      await redisClient.sAdd(
        `user_sessions:${user.user_id}`,
        req.sessionID
      );

      return res.success('Login successful', {
        user: req.session.user
      });
    });


  } catch (error) {
    // Specific handling for authentication errors
    if (error.message === 'Email and password are required' || error.message === 'Invalid Email' || error.message === 'Incorrect Password') {
      return res.error(error.message, 401);
    }
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
    if (!req.session) {
      return res.success('Logged out successfully');
    }

    const userId = req.session?.user?.user_id;
    const sessionId = req.sessionID;

    // Remove this session from Redis user session index
    if (userId && sessionId) {
      await redisClient.sRem(
        `user_sessions:${userId}`,
        sessionId
      );
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