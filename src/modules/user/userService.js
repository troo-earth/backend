const User = require('./userModel');
const bcrypt = require('bcrypt');

function isValidEmail(email) {
  // Simple regex for standard email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  // At least 8 characters, contains a letter, a number, and a special character
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",.<>\/?\\|`~]).{8,}$/.test(password);
}

async function createUser({ user_name, email, password }) {
  // Email format check
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Password format check
  if (!isValidPassword(password)) {
    throw new Error('Invalid password format');
  }

  // Check for duplicate email
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password and create user
  const password_hash = await bcrypt.hash(password, 10);
  return await User.create({ user_name, email, password_hash });
}

// Update user
async function updateUser(user_id, updateFields) {
  await User.update(updateFields, { where: { user_id } });
  return await User.findByPk(user_id);
}

module.exports = { createUser, updateUser };
