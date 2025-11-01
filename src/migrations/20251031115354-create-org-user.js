'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OrgUsers', {
  org_user_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  org_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'Orgs',
      key: 'org_id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  role: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: false,
  }
});
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('OrgUsers');
  }
};