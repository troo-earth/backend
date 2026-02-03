const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Permission = sequelize.define('Permission', {
  permission_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  permission_key: {
    type: DataTypes.STRING(64), // Match VARCHAR(64) from schema
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'Permissions',
  timestamps: false,
});

module.exports = Permission;