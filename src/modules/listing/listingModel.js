const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Listing = sequelize.define('Listings', {
    listing_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    project_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    seller_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    credits_available: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
    },
    price_per_credit: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
    },
    external_trade_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    project_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    project_start_year: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    registry: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location_city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location_state: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location_country: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    thumbnail_url: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('open', 'closed', 'cancelled'),
        defaultValue: 'open',
    },
    sdg_numbers: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    methodology: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    vintage_year: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    tableName: 'Listings',
    timestamps: true,
});

module.exports = Listing;