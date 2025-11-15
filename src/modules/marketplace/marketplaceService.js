// marketplace/service.js
const ICRService = require('../integrations/icr/service');
const { withLogging } = require('../../utils/logger');

const IcrProject = require('./models/icrProjectsModel');  // Import once at top

class marketplaceService {
  constructor() {
    this.icr = require('../integrations/icr/marketplaceService');
  }

  async getAllProjects(options = {}) {
    try {
      const { status } = options;

      // Build where clause
      const where = {};
      if (status) where.status = status;

      // Query DB
      // Add Filtering, Sorting, Pagination as needed later
      const projects = await IcrProject.findAll({
        where,
        order: [['syncedAt', 'DESC']],  // Latest synced first
        attributes: { exclude: ['createdAt', 'updatedAt'] },  // Hide timestamps
      });

      const total = projects.length;
      return { projects, total };
    } catch (err) {
      console.error('DB query error:', err);

      // Fallback to ICR API if Supabase DB fails (e.g., table empty)
      console.log('Falling back to ICR API');  // Debug log
      return this.icr.getAllProjects(options);
    }
  }

  async getProjectById(id) {
    return this.icr.getProjectById(id);
  }

  async retireCredits(userId, creditSerials, options = {}) {
    throw new Error('Retire credits not implemented yet');
  }

  async syncIcrProjects() {
    try {
      const response = await this.icr.getAllProjects();  // Fetches all
      const allProjects = response.projects || [];

      // Filter only validated projects
      const validatedProjects = allProjects.filter(p => p.status === 'validated');
      if (validatedProjects.length === 0) {
        return { success: true, count: 0, message: 'No validated projects found' };
      }

      const mappedProjects = validatedProjects.map(p => ({
        id: p.id,
        num: p.num,
        fullName: p.fullName,
        shortDescription: p.shortDescription,
        description: p.description,
        status: p.status,  // Already 'validated'
        registry: p.registry || 'Carbon registry',
        city: p.city,
        state: p.state,
        countryCode: p.countryCode,
        startDate: p.startDate ? new Date(p.startDate) : null,
        creditingPeriodStartDate: p.creditingPeriodStartDate ? new Date(p.creditingPeriodStartDate) : null,
        thumbnail: p.thumbnail,
        publicUrl: p.publicUrl,
        sector: p.sector,
        additionalities: p.additionalities,
        otherBenefits: p.otherBenefits,
        methodology: p.methodology,
        type: p.type,
        estimatedAnnualMitigations: p.estimatedAnnualMitigations,
        location: p.location,
        kmlFile: p.kmlFile,
        proponents: p.proponents,
        validators: p.validators,
        documentation: p.documentation,
        syncedAt: new Date(),
      }));

      // Loop with upsert for Postgres compatibility (updates on id conflict)
      let syncedCount = 0;
      for (const project of mappedProjects) {
        const [updated] = await IcrProject.upsert(project);
        if (updated) syncedCount++;  // Count new/updated
      }

      console.log(`Synced ${syncedCount} validated ICR projects to DB.`);
      return { success: true, count: syncedCount };
    } catch (err) {
      console.error('Sync error:', err);
      throw err;
    }
  }
}

const instance = new marketplaceService();

// Bind methods and preserve names
const boundGetAllProjects = instance.getAllProjects.bind(instance);
const boundGetProjectById = instance.getProjectById.bind(instance);
const boundRetireCredits = instance.retireCredits.bind(instance);
const boundSyncIcrProjects = instance.syncIcrProjects.bind(instance);

// Export wrapped with names
module.exports = {
  getAllProjects: withLogging(boundGetAllProjects, 'getAllProjectsService'),
  getProjectById: withLogging(boundGetProjectById, 'getProjectByIdService'),
  retireCredits: withLogging(boundRetireCredits, 'retireCreditsService'),
  syncIcrProjects: withLogging(boundSyncIcrProjects, 'syncIcrProjectsService'),
};