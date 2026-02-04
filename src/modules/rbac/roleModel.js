const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Role = sequelize.define('Role', {
  role_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  role_name: {
    type: DataTypes.ENUM('ADMIN', 'MANAGER', 'VIEWER'),
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