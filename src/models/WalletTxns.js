const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('WalletTxns', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    wallet_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    txn_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    txn_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    performed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'WalletTxns',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "WalletTxns_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
