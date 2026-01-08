const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Transactions = sequelize.define('Transactions', {
  tx_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('buy', 'sell', 'transfer', 'retire'),
    allowNull: false
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  from_org_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  to_org_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(18,2),
    allowNull: false
  },
  related_listing_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'Transactions',
  timestamps: true
});

module.exports = Transactions;
