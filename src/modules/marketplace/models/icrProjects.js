// src/modules/marketplace/models/IcrProject.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const IcrProject = sequelize.define('icrProject', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
  },
  num: {
    type: DataTypes.INTEGER,
    allowNull: true,  // Made optional for safety
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: true,  // Made optional for safety
  },
  shortDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'project_concept', 'under_development', 'under_validation', 'validated', 'closed', 'retracted'),
    allowNull: false,
  },
  registry: {
    type: DataTypes.STRING,
    defaultValue: 'Carbon registry',
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  countryCode: {
    type: DataTypes.STRING(2),  // ISO code like 'TR'
    allowNull: true,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  creditingPeriodStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  thumbnail: {
    type: DataTypes.STRING,  // URL
    allowNull: true,
  },
  publicUrl: {
    type: DataTypes.STRING,  // URL
    allowNull: true,
  },
  // Nested objects as JSONB for better performance/indexing
  sector: {
    type: DataTypes.JSONB,  // { id: string, title: string }
    allowNull: true,
  },
  additionalities: {
    type: DataTypes.JSONB,  // Array of { title: string, description: string }
    allowNull: true,
  },
  otherBenefits: {
    type: DataTypes.JSONB,  // Array of { title: string, description: string }
    allowNull: true,
  },
  methodology: {
    type: DataTypes.JSONB,  // { id: string, title: string }
    allowNull: true,
  },
  type: {
    type: DataTypes.JSONB,  // { id: string, title: string, description: string }
    allowNull: true,
  },
  estimatedAnnualMitigations: {
    type: DataTypes.JSONB,  // Array of { vintage: string, estimatedMitigation: number }
    allowNull: true,
  },
  location: {
    type: DataTypes.JSONB,  // Optional { lat: number, lng: number } or null
    allowNull: true,
  },
  kmlFile: {
    type: DataTypes.JSONB,  // { id: UUID, uri: string, type: string, name: string, isPublic: bool, createdAt: date }
    allowNull: true,
  },
  proponents: {
    type: DataTypes.JSONB,  // Array of { id: UUID, fullName: string, logo: string, publicUrl: string }
    allowNull: true,
  },
  validators: {
    type: DataTypes.JSONB,  // Array of { id: UUID, fullName: string, logo: string, publicUrl: string, type: string }
    allowNull: true,
  },
  documentation: {
    type: DataTypes.JSONB,  // Array of { id: UUID, uri: string, type: string, name: string, isPublic: bool }
    allowNull: true,
  },
  syncedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'icrProjects',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['countryCode'] },
    { fields: ['syncedAt'] },
  ],
});

module.exports = IcrProject;