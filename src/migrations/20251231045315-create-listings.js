'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Listings', {
      listing_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: true,  // Updated to allow null as per your note
      },
      credits_available: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
      },
      price_per_credit: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
      },
      external_trade_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      project_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      project_start_year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      registry: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location_city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location_state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location_country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      thumbnail_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('open', 'closed', 'cancelled'),
        defaultValue: 'open',
      },
      sdg_numbers: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      methodology: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      vintage_year: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
    await queryInterface.addConstraint('Listings', {
      fields: ['project_id'],
      type: 'foreign key',
      name: 'fk_listings_project_id',
      references: {
        table: 'icrProjects',
        field: 'id',
      },
      onDelete: 'CASCADE',  // Adjust as needed (e.g., 'RESTRICT' if you don't want cascading deletes)
      onUpdate: 'CASCADE',
    });

    // Add foreign key for seller_id (nullable, so no issue)
    await queryInterface.addConstraint('Listings', {
      fields: ['seller_id'],
      type: 'foreign key',
      name: 'fk_listings_seller_id',
      references: {
        table: 'Sellers',
        field: 'seller_id',
      },
      onDelete: 'SET NULL',  // Since it can be null, SET NULL on delete might be appropriate
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove constraints first before dropping table
    await queryInterface.removeConstraint('Listings', 'fk_listings_project_id');
    await queryInterface.removeConstraint('Listings', 'fk_listings_seller_id');
    await queryInterface.dropTable('Listings');
  },
};