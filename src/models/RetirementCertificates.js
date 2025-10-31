const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('RetirementCertificates', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    txn_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    nft_token_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    issued_to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    issued_to_org_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    issue_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata_link: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'RetirementCertificates',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "RetirementCertificates_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
