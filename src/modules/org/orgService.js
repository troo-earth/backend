const { withLogging } = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');
const User = require('../user/userModel');
const Org = require('./orgModel');

function generateOrgCode(org_name, org_id) {
  const prefix = org_name
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 2)
    .toUpperCase()
    .padEnd(2, 'X');

  const suffix = org_id.replace(/-/g, '').slice(0, 6).toUpperCase();

  return `${prefix}-${suffix}`;
}

async function createOrgService(payload, user_id) {
  const {
    org_name,
    country_code,
    registration_id,
    logo_url,
    incorporation_doc_url,
  } = payload;

  const org_id = uuidv4();
  const org_code = generateOrgCode(org_name, org_id);

  // 1. Create organization
  const org = await Org.create({
    org_id,
    org_code,
    org_name: org_name.trim(),
    country_code: country_code.toUpperCase(),
    registration_id,
    logo_url,
    incorporation_doc_url,
  });

  // 2. Update creator user → attach org + make SUPERADMIN
  await User.update(
    {
      org_id: org.org_id,
      role: 'superadmin',
    },
    { where: { user_id } }
  );

  return org;
}

async function getOrgByIdService(org_id) {
  if (!org_id) throw new Error('Missing org_id');

  const org = await Org.findByPk(org_id);
  if (!org) throw new Error('Org not found');

  const employees = await User.findAll({
    where: { org_id },
    attributes: [
      'user_id',
      'fullname',
      'email',
      'user_name',
    ],
  });

  return {
    ...org.toJSON(),
    employees,
  };
}

async function updateOrgService(org_id, updateFields) {
  if (!org_id) throw new Error('Missing org_id');
  if (!updateFields || Object.keys(updateFields).length === 0) {
    throw new Error('No update fields provided');
  }

  const allowedFields = [
    'org_name',
    'country_code',
    'registration_id',
    'logo_url',
    'incorporation_doc_url',
  ];

  const validUpdates = {};
  for (const key of allowedFields) {
    if (updateFields[key] !== undefined) {
      validUpdates[key] = updateFields[key];
    }
  }

  if (Object.keys(validUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  const [updatedCount] = await Org.update(validUpdates, {
    where: { org_id },
  });

  if (updatedCount === 0) throw new Error('Org not found');

  const updatedOrg = await Org.findByPk(org_id);
  return updatedOrg;
}

module.exports = {
  createOrgService: withLogging(createOrgService, 'createOrgService'),  
  getOrgByIdService: withLogging(getOrgByIdService, 'getOrgByIdService'),
  updateOrgService: withLogging(updateOrgService, 'updateOrgService'),
};
