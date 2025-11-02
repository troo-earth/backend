const { isValidEmail, isValidPassword } = require('../../utils/validation');
const User = require('./userModel');
const bcrypt = require('bcrypt');

// create user
async function createUser({ user_name, email, password }) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (!isValidPassword(password)) {
    throw new Error('Invalid password format');
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const password_hash = await bcrypt.hash(password, 10);
  return await User.create({ user_name, email, password_hash });
}

// Update user
async function updateUser(user_id, updateFields) {
  await User.update(updateFields, { where: { user_id } });
  return await User.findByPk(user_id);
}

module.exports = { createUser, updateUser };
