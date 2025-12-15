const { isValidEmail, isValidPassword } = require('../../utils/validation');
const { withLogging } = require('../../utils/logger');
const User = require('./userModel');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

// create user
async function createUserService({ user_name, email, password }) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (!isValidPassword(password)) {
    throw new Error('Invalid password format');
  }

  const existingEmailUser = await User.findOne({ where: { email } });
  if (existingEmailUser) {
    throw new Error('Email already registered');
  }

  const existingUserNameUser = await User.findOne({ where: { user_name } });
  if (existingUserNameUser) {
    throw new Error('Username already registered');
  }

  const password_hash = await bcrypt.hash(password, 10);
  return await User.create({ user_name, email, password_hash });
}


async function updateUserService(user_id, updateFields) {
  if (!user_id) throw new Error('Missing user ID');
  if (!updateFields || Object.keys(updateFields).length === 0) throw new Error('Missing update fields');

  const allowedFields = ['user_name', 'email', 'password'];
  const validUpdateFields = Object.keys(updateFields).filter(f => allowedFields.includes(f));
  if (validUpdateFields.length === 0) throw new Error('No valid update fields provided');

  if (updateFields.email && !updateFields.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error('Invalid email format');
  }

  // Uniqueness checks using Sequelize Op.ne
  if (updateFields.email) {
    const exists = await User.findOne({
      where: {
        email: updateFields.email,
        user_id: { [Op.ne]: user_id }
      }
    });
    if (exists) throw new Error('Email already registered');
  }

  if (updateFields.user_name) {
    const exists = await User.findOne({
      where: {
        user_name: updateFields.user_name,
        user_id: { [Op.ne]: user_id }
      }
    });
    if (exists) throw new Error('Username already registered');
  }

  // Hash password if updating
  if (updateFields.password) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(updateFields.password, saltRounds);
    updateFields.password_hash = hash;
    delete updateFields.password;
  }

  // Perform update
  await User.update(updateFields, { where: { user_id } });
  const user = await User.findByPk(user_id);
  if (!user) throw new Error('User not found');

  return user;
}

async function viewUserService(user_id) {
  if (!user_id) throw new Error('Missing user ID');
  const user = await User.findByPk(user_id);
  if (!user) throw new Error('User not found');
  return user;
}

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
  createUserService: withLogging(createUserService, 'createUserService'),
  updateUserService: withLogging(updateUserService, 'updateUserService'),
  viewUserService: withLogging(viewUserService, 'viewUserService'),
  loginUserService: withLogging(loginUserService, 'loginUserService'),
  verifyUserService: withLogging(verifyUserService, 'verifyUserService'),
  logoutUserService: withLogging(logoutUserService, 'logoutUserService'),
};
