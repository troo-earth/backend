const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const RolePermission = sequelize.define('RolePermission', {
  role_permissions_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  role_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  permission_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'RolePermissions',
  timestamps: true, // ✅ Table DOES have createdAt and updatedAt columns
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'permission_id']
    }
  ]
});

module.exports = RolePermission;