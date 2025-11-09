const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const OrgUser = sequelize.define('OrgUser', {
  org_user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  org_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true, 
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
}, {
  tableName: 'OrgUsers',
  timestamps: true,
});

module.exports = OrgUser;
