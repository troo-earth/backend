'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CarbonCredits', {
      carbon_credit_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'project_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      total_credits: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      available_credits: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      vintage_year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      standard: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CarbonCredits');
  }
};