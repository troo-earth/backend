'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RetirementCertificates', {
      retirement_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      txn_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Txns',
          key: 'txn_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      nft_token_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      issued_to_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      issued_to_org_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Orgs',
          key: 'org_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      issue_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      metadata_link: {
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
    await queryInterface.dropTable('RetirementCertificates');
  }
};