const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Invitation = sequelize.define('Invitation', {

  invite_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  org_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },

  role: {
    type: DataTypes.ENUM(
      'superadmin',
      'admin',
      'manager',
      'viewer'
    ),
    allowNull: false,
  },

  invite_token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  status: {
    type: DataTypes.ENUM(
      'pending',
      'accepted',
      'revoked',
      'expired'
    ),
    defaultValue: 'pending',
  },

  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },

}, {
  tableName: 'Invitations',
  timestamps: true,
});

module.exports = Invitation;
