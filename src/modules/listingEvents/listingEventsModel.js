const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ListingEvents = sequelize.define(
  'ListingEvents',
  {
    event_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    listing_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Listings',
        key: 'listing_id',
      },
    },

    event_type: {
      type: DataTypes.ENUM(
        'CREATED',
        'UPDATED',
        'PARTIALLY_FILLED',
        'FILLED',
        'CANCELLED',
        'CLOSED'
      ),
      allowNull: false,
    },

    event_data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    actor_org_code: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Orgs',
        key: 'org_code',
      },
    },
  },
  {
    tableName: 'ListingEvents',
    timestamps: true,
    updatedAt: false, // immutable log
  }
);

module.exports = ListingEvents;
