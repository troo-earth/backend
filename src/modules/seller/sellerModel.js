const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Seller = sequelize.define('Seller', {
    seller_id: {
        type: DataTypes.UUID,
        defaultValue: undefined,
        primaryKey: true,
    },
    seller_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    linked_org_id: {
        type: DataTypes.UUID,
        allowNull: false,
    }
}, {
    tableName: 'Sellers',
    timestamps: true,
});

module.exports = Seller;