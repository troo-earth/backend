const { isValidEmail, isValidPassword } = require('../../utils/validation');
const { withLogging } = require('../../utils/logger');
const User = require('./userModel');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { sendEmail } = require('../emails/emailService');
const { accountCreatedTemplate, accountUpdatedTemplate } = require('../emails/emailTemplates');
const { validateRoleAssignment } = require('./policies/roleGovernance');
const { destroyUserSessions } = require('../auth/policies/sessionInvalidation');

async function createUserService({ user_name, email, password, fullname }) {
  // Validate and sanitize inputs
  if (!user_name || typeof user_name !== 'string' || user_name.trim() === '') {
    throw new Error('Username is required and must be a non-empty string');
  }

  if (!email || !isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (!password || !isValidPassword(password)) {
    throw new Error('Invalid password format');
  }

  if (!fullname || typeof fullname !== 'string' || fullname.trim() === '') {
    throw new Error('Full name is required and must be a non-empty string');
  }

  // Check for invalid characters in fullname (letters, spaces, hyphens, apostrophes only)
  const nameRegex = /^[A-Za-z\s\-']+$/;
  if (!nameRegex.test(fullname.trim())) {
    throw new Error('Full name contains invalid characters (only letters, spaces, hyphens, and apostrophes allowed)');
  }

  const trimmedUsername = user_name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const cleanedFullname = fullname
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\s+/g, ' ');  // Title Case and normalize spaces

  const firstName = cleanedFullname.split(' ')[0];

  // Uniqueness checks
  const existingEmailUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingEmailUser) {
    throw new Error('Email already registered');
  }

  const existingUserNameUser = await User.findOne({ where: { user_name: trimmedUsername } });
  if (existingUserNameUser) {
    throw new Error('Username already registered');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create user in DB
  const newUser = await User.create({
    user_name: trimmedUsername,
    email: normalizedEmail,
    password_hash,
    fullname: cleanedFullname,  // Add cleaned fullname to DB
  });

  // Send welcome email using first name (non-blocking)
  const html = accountCreatedTemplate({ user_name: firstName });
  sendEmail({
    to: normalizedEmail,
    subject: 'Welcome to troo.earth!',
    html,
  }).catch((error) => {
    console.error(`Failed to send welcome email to ${normalizedEmail}:`, error.message);
    // Optionally, queue for retry or log to monitoring service
  });

  return newUser;  // Return raw user object (controller will sanitize)
}

async function updateUserService(user_id, updateFields) {
  if (!user_id) throw new Error('Missing user ID');
  if (!updateFields || Object.keys(updateFields).length === 0)
    throw new Error('Missing update fields');

  // ✅ FIXED allowed fields
  const allowedFields = ['user_name', 'email', 'password', 'fullname', 'org_id'];
  const validUpdateFields = Object.keys(updateFields).filter(f =>
    allowedFields.includes(f)
  );

  if (validUpdateFields.length === 0)
    throw new Error('No valid update fields provided');

  // --- Email ---
  if (updateFields.email) {
    if (!isValidEmail(updateFields.email)) {
      throw new Error('Invalid email format');
    }
    updateFields.email = updateFields.email.trim().toLowerCase();
  }

  // --- Password ---
  if (updateFields.password) {
    if (!isValidPassword(updateFields.password)) {
      throw new Error('Invalid password format');
    }
    updateFields.password_hash = await bcrypt.hash(updateFields.password, 10);
    delete updateFields.password;
  }

  // --- Full name ---
  if (updateFields.fullname) {
    if (typeof updateFields.fullname !== 'string' || !updateFields.fullname.trim()) {
      throw new Error('Full name must be a non-empty string');
    }

    const nameRegex = /^[A-Za-z\s\-']+$/;
    if (!nameRegex.test(updateFields.fullname.trim())) {
      throw new Error('Full name contains invalid characters');
    }

    updateFields.fullname = updateFields.fullname
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/\s+/g, ' ');
  }

  // --- Username ---
  if (updateFields.user_name) {
    updateFields.user_name = updateFields.user_name.trim();
  }

  // --- org_id (NEW) ---
  if (updateFields.org_id !== undefined) {
    if (updateFields.org_id === null) {
      updateFields.org_id = null; // allow unassign
    } else {
      if (!isValidUUID(updateFields.org_id)) {
        throw new Error('Invalid org_id');
      }
    }
  }

  // --- Update ---
  const [updatedCount] = await User.update(updateFields, {
    where: { user_id }
  });

  if (updatedCount === 0) throw new Error('User not found');

  const updatedUser = await User.findByPk(user_id);

  // --- Email notification (non-blocking) ---
  const nameForEmail =
    updateFields.fullname || updatedUser.fullname || updatedUser.user_name;

  const firstName = nameForEmail.split(' ')[0];
  const html = accountUpdatedTemplate({ user_name: firstName });

  sendEmail({
    to: updatedUser.email,
    subject: 'Your troo.earth Account Was Updated',
    html,
  }).catch(err => {
    console.error(
      `Failed to send update email to ${updatedUser.email}:`,
      err.message
    );
  });

  return updatedUser;
}


async function viewUserService(user_id) {
  if (!user_id) throw new Error('Missing user ID');
  const user = await User.findByPk(user_id);
  if (!user) throw new Error('User not found');
  return user;
}

const updateUserRoleService = async ({
  actorUserId,
  actorRole,
  targetUserId,
  newRole,
  org_id,
}) => {

  const targetUser = await User.findByPk(targetUserId);

  if (!targetUser) {
    throw new Error('User not found');
  }

  // Governance validation
  await validateRoleAssignment({
    actorRole,
    targetRole: newRole,
    targetUserId,
    org_id,
    actorUserId,
  });

  // Update role
  targetUser.role = newRole;
  await targetUser.save();

  // Invalidate all sessions so new role applies immediately
  await destroyUserSessions(targetUserId);

  return targetUser;
};

module.exports = {
  createUserService: withLogging(createUserService, 'createUserService'),
  updateUserService: withLogging(updateUserService, 'updateUserService'),
  viewUserService: withLogging(viewUserService, 'viewUserService'),
  updateUserRoleService: withLogging(updateUserRoleService, 'updateUserRoleService'),
};