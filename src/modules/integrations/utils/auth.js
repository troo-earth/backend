// utils/auth.js
const { getConfig } = require('../../../config/config');

const getAuthHeaders = (registry) => {
  const key = `${registry.toUpperCase()}_API_KEY`;
  const apiKey = getConfig(key);
  if (!apiKey) {
    throw new Error(`API key for ${registry} not found in config`);
  }
  return { Authorization: `Bearer ${apiKey}` };
};

module.exports = { getAuthHeaders };