const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Role = sequelize.define('Role', {
  role_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  role_name: {
    type: DataTypes.STRING(100), // Match VARCHAR(100) from schema
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'Roles',
  timestamps: true, // Table has createdAt and updatedAt columns
});

module.exports = Role;