'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('icrProjects', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      num: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shortDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'project_concept', 'under_development', 'under_validation', 'validated', 'closed', 'retracted'),
        allowNull: false,
      },
      registry: {
        type: Sequelize.STRING,
        defaultValue: 'Carbon registry',
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      countryCode: {
        type: Sequelize.STRING(2),
        allowNull: true,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      creditingPeriodStartDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      thumbnail: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      publicUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sector: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      additionalities: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      otherBenefits: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      methodology: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      type: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      estimatedAnnualMitigations: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      location: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      kmlFile: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      proponents: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      validators: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      documentation: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      syncedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes (reference new table name)
    await queryInterface.addIndex('icrProjects', ['status']);
    await queryInterface.addIndex('icrProjects', ['countryCode']);
    await queryInterface.addIndex('icrProjects', ['syncedAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('icrProjects');
  }
};