const RetirementCertificate = require('./retirementCertificateModel');
const { withLogging } = require('../../utils/logger');

const viewOrgRetirementService = async (org_id) => {
  if (!org_id) {
    return { error: 'org_id missing from session', statusCode: 401 };
  }

  const retirements = await RetirementCertificate.findAll({
    where: { org_id },
    order: [['createdAt', 'DESC']],
  });

  return { data: retirements };
};

const viewOneRetirementService = async (certificate_id) => {
  if (!certificate_id) {
    return { error: 'certificate_id is required', statusCode: 400 };
  }

  const cert = await RetirementCertificate.findByPk(certificate_id);

  if (!cert) {
    return { error: 'Retirement certificate not found', statusCode: 404 };
  }

  return { data: cert };
};

module.exports = {
  viewOrgRetirementService: withLogging(viewOrgRetirementService, 'viewOrgRetirementService'),
  viewOneRetirementService: withLogging(viewOneRetirementService, 'viewOneRetirementService'),
};
