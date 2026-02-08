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
    throw new Error('Invalid Email');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Incorrect Password');
  }

  return user;
}

async function verifyUserService(sessionUser) {
  if (!sessionUser || !sessionUser.user_id) {
    throw new Error('Not authenticated');
  }

  return {
    user_id: sessionUser.user_id,
    email: sessionUser.email,
    fullname: sessionUser.fullname,
    role: sessionUser.role,
    org_id: sessionUser.org_id
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