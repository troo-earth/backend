const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const RetirementCertificate = sequelize.define('RetirementCertificate', {
    certificate_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    org_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    project_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false
    },
    retired_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    purpose: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    beneficiary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    transaction_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    certificate_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('issued', 'revoked'),
        allowNull: false,
        defaultValue: 'issued'
    }
}, {
    tableName: 'RetirementCertificates',
    timestamps: true,
});

module.exports = RetirementCertificate;