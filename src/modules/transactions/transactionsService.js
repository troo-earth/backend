const Transactions = require('./transactionsModel');
const Org = require('../org/orgModel');
const IcrProject = require('../marketplace/models/icrProjects');
const { withLogging } = require('../../utils/logger');
const { Op } = require('sequelize');


//This is a QUICK FIX to get transaction data without exposing UUIDs.
//The DB must be migrated to remove org_id and project_id from the Transactions table 
//Use Org_Code and Project_Name instead for readability at the API level.
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

  // 4. Fetch project name map
  const projects = await IcrProject.findAll({
    where: { id: [...projectIds] },
    attributes: ['id', 'fullName'],
  });

  const projectNameMap = {};
  projects.forEach(p => {
    projectNameMap[p.id] = p.fullName;
  });

  // 5. Shape response (NO UUIDs exposed)
  const formattedTransactions = transactions.map(tx => ({
    tx_id: tx.tx_id,
    type: tx.type,
    amount: tx.amount,
    created_at: tx.createdAt,

    from_org_code: tx.from_org_id
      ? orgCodeMap[tx.from_org_id] || null
      : null,

    to_org_code: tx.to_org_id
      ? orgCodeMap[tx.to_org_id] || null
      : null,

    project_name: tx.project_id
      ? projectNameMap[tx.project_id] || null
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
