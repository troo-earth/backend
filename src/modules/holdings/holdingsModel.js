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
        type: DataTypes.DECIMAL(18,2),
        allowNull: false,
        defaultValue: 0,
    },
    locked_for_sale: {
        type: DataTypes.DECIMAL(18,2),
        allowNull: false,
        defaultValue: 0,
    }
}, {
    tableName: 'Holdings',
    timestamps: true,
});

// Virtual calculated field
Holdings.prototype.available_to_use = function () {
    return (parseFloat(this.credit_balance) - parseFloat(this.locked_for_sale)).toFixed(2);
};

module.exports = Holdings;
