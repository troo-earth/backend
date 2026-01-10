const supabase = require('../../config/supabase');
const { withLogging } = require('../../utils/logger');

async function getSignedUploadUrl({ bucket, file_name }) {
  const path = `${Date.now()}-${file_name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error) throw error;

  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

  return {
    uploadUrl: data.signedUrl,
    publicUrl,
    path,
  };
}

module.exports = {
  getSignedUploadUrl: withLogging(getSignedUploadUrl, 'getSignedUploadUrl'),
};
