const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fullname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  org_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM(
      'superadmin',
      'admin',
      'manager',
      'viewer'
    ),
    allowNull: false,
    defaultValue: 'viewer',
  },

}, {
  tableName: 'Users',
  timestamps: true,
});

module.exports = User;
