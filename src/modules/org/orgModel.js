const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');


const Org = sequelize.define('Org', {
  org_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  org_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'Orgs',
  timestamps: true,
});

module.exports = Org;
