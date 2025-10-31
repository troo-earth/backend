const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CarbonCredits', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_credits: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    available_credits: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    vintage_year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    standard: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'CarbonCredits',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "CarbonCredits_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
