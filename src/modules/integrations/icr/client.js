// icr/client.js
const axios = require('axios');
const { getAuthHeaders } = require('../utils/auth');
const { handleApiError } = require('../utils/errors');
const { getConfig } = require('../../../config/config');

const baseURL = 'https://api.carbonregistry.com/v1';  // ICR base URL

class ICRClient {
  constructor() {
    this.client = axios.create({ baseURL });
  }

  async request(config) {
    const headers = {
      ...getAuthHeaders('icr'),
      'Content-Type': 'application/json',
      ...config.headers,
    };

    try {
      const response = await this.client.request({ ...config, headers });
      return response.data;
    } catch (error) {
      handleApiError(error, 'icr');
    }
  }

  get(endpoint) {
    return this.request({ method: 'GET', url: endpoint });
  }

  post(endpoint, data) {
    return this.request({ method: 'POST', url: endpoint, data });
  }

  // Add later: put, delete
}

module.exports = new ICRClient();