const { getSignedUploadUrl } = require('./uploadService');
const { withLogging } = require('../../utils/logger');

async function uploadOrgLogoController(req, res, next) {
  try {
    const { file_name } = req.body;

    if (!file_name) {
      return res.error('file_name is required', 400);
    }

    const result = await getSignedUploadUrl({
      bucket: 'org-logos',
      file_name,
    });

    return res.success('Upload URL generated', result);
  } catch (error) {
    next(error);
  }
}

async function uploadOrgDocController(req, res, next) {
  try {
    const { file_name } = req.body;

    if (!file_name) {
      return res.error('file_name is required', 400);
    }

    const result = await getSignedUploadUrl({
      bucket: 'org-docs',
      file_name,
    });

    return res.success('Upload URL generated', result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadOrgLogoController: withLogging(uploadOrgLogoController, 'uploadOrgLogoController'),  
  uploadOrgDocController: withLogging(uploadOrgDocController, 'uploadOrgDocController'),
};
