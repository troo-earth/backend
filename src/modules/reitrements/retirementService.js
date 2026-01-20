const RetirementCertificate = require('./retirementCertificateModel');
const { withLogging } = require('../../utils/logger');

const viewAllRetirementsService = async () => {
  const retirements = await RetirementCertificate.findAll({
    order: [['createdAt', 'DESC']],
  });

  return { data: retirements };
};

const viewOrgRetirementsService = async (org_id) => {
  if (!org_id) {
    return { error: 'org_id missing from session', statusCode: 401 };
  }

  const retirements = await RetirementCertificate.findAll({
    where: { org_id },
    order: [['createdAt', 'DESC']],
  });

  return { data: retirements };
};

module.exports = {
  viewAllRetirementsService: withLogging(viewAllRetirementsService, 'viewAllRetirementsService'),
  viewOrgRetirementsService: withLogging(viewOrgRetirementsService, 'viewOrgRetirementsService'),
};
