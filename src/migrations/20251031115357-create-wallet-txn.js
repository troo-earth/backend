'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WalletTxns', {
      wallet_txn_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      wallet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Wallets',
          key: 'wallet_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      txn_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Txns',
          key: 'txn_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      txn_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false
      },
      performed_at: {
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
    await queryInterface.dropTable('WalletTxns');
  }
};