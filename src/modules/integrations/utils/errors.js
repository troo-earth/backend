// utils/errors.js
class RegistryError extends Error {
  constructor(message, code, registry) {
    super(message);
    this.code = code;
    this.registry = registry;
  }
}

const handleApiError = (error, registry) => {
  if (error.response && error.response.status === 401) {
    throw new RegistryError('Unauthorized: Check API key', 401, registry);
  }
  if (error.response && error.response.status === 429) {
    throw new RegistryError('Rate limited: Too many requests', 429, registry);
  }
  throw new RegistryError(error.message || 'API request failed', error.response?.status || 500, registry);
};

module.exports = { RegistryError, handleApiError };