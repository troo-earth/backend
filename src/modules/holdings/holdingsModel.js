const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Holdings = sequelize.define('Holdings', {
    holding_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    org_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    project_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    vintage_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },

    credit_balance: {
        type: DataTypes.DECIMAL(18, 2),   // two decimals only
        allowNull: false,
        defaultValue: 0,
    }
}, {
    tableName: 'Holdings',
    timestamps: true,
});

module.exports = Holdings;