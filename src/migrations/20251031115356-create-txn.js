'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Txns', {
      txn_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      buyer_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      buyer_org_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Orgs',
          key: 'org_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      credit_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'CarbonCredits',
          key: 'carbon_credit_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price_per_credit: {
        type: Sequelize.DECIMAL,
        allowNull: false
      },
      total_price: {
        type: Sequelize.DECIMAL,
        allowNull: false
      },
      transaction_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      transaction_date: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('Txns');
  }
};