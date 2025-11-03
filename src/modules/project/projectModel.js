const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Project = sequelize.define('Project', {
    project_id: {
        type: DataTypes.UUID,
        defaultValue: undefined,
        primaryKey: true,
    },
    project_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    seller_id: {
        type: DataTypes.UUID,
        allowNull: true,
    }
}, {
    tableName: 'Projects',
    timestamps: true,
});

module.exports = Project;