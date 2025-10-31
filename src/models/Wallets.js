const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Wallets', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    owner_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    owner_org_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    wallet_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Wallets',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "Wallets_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
