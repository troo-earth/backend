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

  country_code: {
    type: DataTypes.STRING(2),   // ISO-2 (US, IN, DE)
    allowNull: false,
  },

  registration_id: {
    type: DataTypes.STRING,      // Company / registry number
    allowNull: true,
  },

  logo_url: {
    type: DataTypes.TEXT,        // Logo image URL
    allowNull: true,
  },

  incorporation_doc_url: {
    type: DataTypes.TEXT,        // PDF or image URL
    allowNull: true,
  },

}, {
  tableName: 'Orgs',
  timestamps: true,
});

module.exports = Org;
