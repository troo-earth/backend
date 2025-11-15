// integrations/icr/marketplaceService.js
const ICRService = require('./service');  // Exports the class ICRService

class ICRMarketplaceService {
  constructor() {
    this.raw = ICRService;
  }

  async getAllProjects(options = {}) {
    const data = await this.raw.getAllProjects(options);
    // Platform tweak: Calculate total CO2 for each project (sum mitigations)
    data.projects = data.projects.map(p => ({
      ...p,
      totalCo2: p.estimatedAnnualMitigations ? p.estimatedAnnualMitigations.reduce((sum, m) => sum + (m.estimatedMitigation || 0), 0) : 0,
    }));
    return data;
  }

  async getProjectById(id) {
    const data = await this.raw.getProjectById(id);
    // Tweak: Add totalCo2 to single project
    data.totalCo2 = data.estimatedAnnualMitigations ? data.estimatedAnnualMitigations.reduce((sum, m) => sum + (m.estimatedMitigation || 0), 0) : 0;
    return data;
  }

  // Future: retireCredits with user mapping
  async retireCredits(userId, creditSerials, options = {}) {
    options.entityId = `user-${userId}`;  // Your platform's ICR entity mapping
    return this.raw.retireCredits(creditSerials, options);
  }
}

module.exports = new ICRMarketplaceService();