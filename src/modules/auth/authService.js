const { withLogging } = require('../../utils/logger');
const User = require('../user/userModel');
const bcrypt = require('bcrypt');

// Login user - returns the user if credentials are valid
async function loginUserService({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ where: { email } });

  if (!user || !user.password_hash) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  return user;
}

// Verify current session user - just returns the session user or throws
async function verifyUserService(sessionUser) {
  if (!sessionUser || !sessionUser.id) {
    throw new Error('Not authenticated');
  }
  // Optionally: you could re-fetch fresh user from DB here if you want up-to-date data
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
  };
}

// Logout - no DB logic needed, but keeps symmetry
async function logoutUserService() {
  // This is intentionally a no-op at service level
  // Real work (destroying session) happens in controller/middleware
  return true;
}

module.exports = {
  loginUserService: withLogging(loginUserService, 'loginUserService'),
  verifyUserService: withLogging(verifyUserService, 'verifyUserService'),
  logoutUserService: withLogging(logoutUserService, 'logoutUserService'),
};