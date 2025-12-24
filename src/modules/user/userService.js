const { isValidEmail, isValidPassword } = require('../../utils/validation');
const { withLogging } = require('../../utils/logger');
const User = require('./userModel');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sendEmail } = require('../emails/emailService');
const { accountCreatedTemplate } = require('../emails/emailTemplates');

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
  const newUser = await User.create({ user_name, email, password_hash });

  // Send welcome email (non-blocking; catch errors to avoid blocking user creation)
  const html = accountCreatedTemplate({ user_name });
  sendEmail({
    to: email,
    subject: 'Welcome to troo.earth!',
    html,
  }).catch((error) => {
    console.error(`Failed to send welcome email to ${email}:`, error.message);
    // Optionally, queue for retry or log to monitoring service
  });

  return newUser; // Return the new user (sanitize if needed, e.g., omit password_hash)
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

module.exports = {
  createUserService: withLogging(createUserService, 'createUserService'),
  updateUserService: withLogging(updateUserService, 'updateUserService'),
  viewUserService: withLogging(viewUserService, 'viewUserService'),
};