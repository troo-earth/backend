const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

// Local Sequelize model representation for Invitations (optional helper).
// Note: primary invitation storage in this project is Supabase; this model
// is provided for symmetry and optional local usage. If the local DB
// doesn't have an Invitations table, Sequelize operations will fail until
// a migration creates it. Use with caution.
const Invitation = sequelize.define('Invitation', {
  invite_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  org_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  invited_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  role_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING','ACCEPTED','DECLINED','REVOKED'),
    allowNull: true,
  },
  revoked_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Invitations',
  timestamps: true,
});

module.exports = Invitation;
