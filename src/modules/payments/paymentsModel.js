// src/modules/payments/paymentModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Payments = sequelize.define(
  'Payments',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Stripe identifiers (idempotency + audit)
    stripe_payment_intent_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    stripe_event_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    // Business context (copied from metadata)
    buyer_org_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    listing_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    credits_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },

    // Payment facts
    amount_paid_cents: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Full Stripe object for audit/debug
    raw_payment_intent: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    tableName: 'Payments',
    timestamps: true,
  }
);

module.exports = Payments;
