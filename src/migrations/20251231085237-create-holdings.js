'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Holdings', {
      holding_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      vintage_year: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      credit_balance: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add foreign key for project_id
    await queryInterface.addConstraint('Holdings', {
      fields: ['project_id'],
      type: 'foreign key',
      name: 'fk_holdings_project_id',
      references: {
        table: 'icrProjects',
        field: 'id',
      },
      onDelete: 'CASCADE',  // Adjust as needed
      onUpdate: 'CASCADE',
    });

    // Add foreign key for org_id
    await queryInterface.addConstraint('Holdings', {
      fields: ['org_id'],
      type: 'foreign key',
      name: 'fk_holdings_org_id',
      references: {
        table: 'Orgs',  // Assuming the organizations table is named 'Orgs'
        field: 'org_id',
      },
      onDelete: 'CASCADE',  // Adjust as needed (e.g., 'SET NULL' if org can be deleted without affecting holdings)
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove constraints first before dropping table
    await queryInterface.removeConstraint('Holdings', 'fk_holdings_project_id');
    await queryInterface.removeConstraint('Holdings', 'fk_holdings_org_id');
    await queryInterface.dropTable('Holdings');
  },
};