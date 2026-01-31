const Transactions = require('./transactionsModel');
const Org = require('../org/orgModel');
const IcrProject = require('../marketplace/models/icrProjects');
const { withLogging } = require('../../utils/logger');
const { Op } = require('sequelize');

// This is a QUICK FIX NOTE:
// UUIDs remain internal. API exposes org_code, project_name, thumbnail only.

const viewTransactionsService = async (org_id) => {
  if (!org_id) {
    return { error: 'org_id missing from session', statusCode: 401 };
  }

  // 1. Fetch transactions involving this org
  const transactions = await Transactions.findAll({
    where: {
      [Op.or]: [
        { from_org_id: org_id },
        { to_org_id: org_id },
      ],
    },
    order: [['createdAt', 'DESC']],
  });

  if (!transactions.length) {
    return { data: [] };
  }

  // 2. Collect unique org_ids & project_ids
  const orgIds = new Set();
  const projectIds = new Set();

  transactions.forEach(tx => {
    if (tx.from_org_id) orgIds.add(tx.from_org_id);
    if (tx.to_org_id) orgIds.add(tx.to_org_id);
    if (tx.project_id) projectIds.add(tx.project_id);
  });

  // 3. Fetch org_code map
  const orgs = await Org.findAll({
    where: { org_id: [...orgIds] },
    attributes: ['org_id', 'org_code'],
  });

  const orgCodeMap = {};
  orgs.forEach(o => {
    orgCodeMap[o.org_id] = o.org_code;
  });

  // 4. Fetch project name + thumbnail map
  const projects = await IcrProject.findAll({
    where: { id: [...projectIds] },
    attributes: ['id', 'fullName', 'thumbnail'],
  });

  const projectMap = {};
  projects.forEach(p => {
    projectMap[p.id] = {
      name: p.fullName,
      thumbnail: p.thumbnail,
    };
  });

  const formattedTransactions = transactions.map(tx => ({
    tx_id: tx.tx_id,
    type: tx.type,
    amount: tx.amount,
    created_at: tx.createdAt,

    // org identifiers (human-readable)
    from_org_code: tx.from_org_id
      ? orgCodeMap[tx.from_org_id] || null
      : null,

    to_org_code: tx.to_org_id
      ? orgCodeMap[tx.to_org_id] || null
      : null,

    // project identifiers & metadata
    project_id: tx.project_id, // <-- explicitly included
    project_name: tx.project_id
      ? projectMap[tx.project_id]?.name || null
      : null,

    project_thumbnail: tx.project_id
      ? projectMap[tx.project_id]?.thumbnail || null
      : null,
  }));


  return {
    data: formattedTransactions,
  };
};

module.exports = {
  viewTransactionsService: withLogging(
    viewTransactionsService,
    'viewTransactionsService'
  ),
};
