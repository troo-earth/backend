const { isValidEmail, isValidPassword } = require('../../utils/validation');
const { withLogging } = require('../../utils/logger');
const User = require('./userModel');
const bcrypt = require('bcrypt');
const sequelize = require('../../config/database');
const { Role } = require('../../models/associations');
const { sendEmail } = require('../emails/emailService');
const { accountCreatedTemplate, accountCreatedTextTemplate, accountUpdatedTemplate, accountUpdatedTextTemplate } = require('../emails/emailTemplates');
const { validate: isValidUUID } = require('uuid');

async function createUserService({ user_name, email, password, fullname, org_id, role_id }) {
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

  // Validate optional UUID fields
  if (org_id && !isValidUUID(org_id)) {
    throw new Error('Invalid org_id format');
  }

  if (role_id && !isValidUUID(role_id)) {
    throw new Error('Invalid role_id format');
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

  const existingEmailUser = await User.findOne({ 
    where: { email: normalizedEmail }
  });
  if (existingEmailUser) {
    throw new Error('Email already registered');
  }

  const existingUserNameUser = await User.findOne({ 
    where: { user_name: trimmedUsername }
  });
  if (existingUserNameUser) {
    throw new Error('Username already registered');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create user in DB
  const userData = {
    user_name: trimmedUsername,
    email: normalizedEmail,
    password_hash,
    fullname: cleanedFullname,
  };

  // Add optional org/role fields if provided
  if (org_id) userData.org_id = org_id;
  if (role_id) userData.role_id = role_id;

  const newUser = await User.create(userData);

  // Send welcome email using first name (non-blocking)
  const html = accountCreatedTemplate({ user_name: firstName });
  const text = accountCreatedTextTemplate({ user_name: firstName });
  
  sendEmail({
    to: normalizedEmail,
    subject: 'Welcome to troo.earth!',
    html,
    text,
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

  const firstNameForUpdate = nameForEmail.split(' ')[0];
  const html = accountUpdatedTemplate({ user_name: firstNameForUpdate });
  const text = accountUpdatedTextTemplate({ user_name: firstNameForUpdate });

  sendEmail({
    to: updatedUser.email,
    subject: 'Your troo.earth Account Was Updated',
    html,
    text,
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

async function deleteUserService(user_id, sessionUser = null) {
  if (!user_id) throw new Error('Missing user ID');

  // Use a transaction to ensure atomicity and prevent race conditions
  const result = await sequelize.transaction(async (t) => {
    // Find the user with row-level locking to prevent concurrent modifications
    const user = await User.findByPk(user_id, {
      lock: t.LOCK.UPDATE, // Acquire exclusive lock on this user row
      transaction: t
    });
    
    if (!user) throw new Error('User not found');

    // Determine user's role_name from the database using the locked user row as source of truth
    let user_role_name = null;
    if (user.role_id) {
      const role = await Role.findByPk(user.role_id, {
        attributes: ['role_name'],
        transaction: t
      });
      if (role && role.role_name) {
        user_role_name = role.role_name;
      }
    }

    // Note: we intentionally do not trust sessionUser.role_name here to avoid stale session issues
    // that could bypass the sole-admin check.
    // If user is ADMIN and belongs to an org, ensure there is at least one other ADMIN
    if (user_role_name === 'ADMIN' && user.org_id) {
      // Get ADMIN role using Sequelize
      const adminRole = await Role.findOne({
        where: { role_name: 'ADMIN' },
        attributes: ['role_id'],
        transaction: t // Ensure consistent view within the transaction
      });
      
      if (adminRole && adminRole.role_id) {
        // Count admins in the organization with shared lock to prevent concurrent admin deletions
        const adminCount = await User.count({ 
          where: { 
            org_id: user.org_id, 
            role_id: adminRole.role_id // Use role_id instead of role_name
          },
          lock: t.LOCK.SHARE, // Shared lock prevents concurrent admin role changes/deletions
          transaction: t
        });
        
        if (adminCount <= 1) {
          const err = new Error('Cannot delete the sole admin of an organization. Please assign another admin first.');
          err.code = 'SOLE_ADMIN';
          throw err;
        }
      }
    }

    // Permanently delete user (within the same transaction)
    await User.destroy({ 
      where: { user_id: user_id },
      transaction: t 
    });

    return true;
  });

  return result;
}

module.exports = {
  createUserService: withLogging(createUserService, 'createUserService'),
  updateUserService: withLogging(updateUserService, 'updateUserService'),
  viewUserService: withLogging(viewUserService, 'viewUserService'),
  deleteUserService: withLogging(deleteUserService, 'deleteUserService'),
};