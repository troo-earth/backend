// icr/service.js
const client = require('./client');

class ICRService {
  async getAllProjects(options = {}) {
    // Validate options
    if (typeof options !== 'object') options = {};
    const { status } = options;

    // Validate status enum
    const validStatuses = ['draft', 'project_concept', 'under_development', 'under_validation', 'validated', 'closed', 'retracted'];
    if (status && !validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Fetch from API (no params; assumes all in one call)
    const response = await client.get('/projects');
    const { projects } = response;

    // Client-side filter by status
    let filtered = projects || [];
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }

    return { 
      projects: filtered, 
      total: filtered.length 
    };
  }
}

module.exports = new ICRService();