const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('OrgUsers', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    org_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    added_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'OrgUsers',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "OrgUsers_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
