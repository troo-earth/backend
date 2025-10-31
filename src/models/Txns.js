const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Txns', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    buyer_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    buyer_org_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    credit_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    price_per_credit: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    total_price: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    transaction_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Txns',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "Txns_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
