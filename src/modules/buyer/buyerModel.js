const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Buyer = sequelize.define(
	'Buyer',
	{
		buyer_id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
			allowNull: false,
			field: 'buyer_id',
		},
		buyer_type: {
			type: DataTypes.STRING,
			allowNull: true,
			field: 'buyer_type',
		},
		user_id: {
			type: DataTypes.UUID,
			allowNull: false,
			field: 'user_id',
		},
	},
	{
		tableName: 'Buyer',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
	}
);

module.exports = {
	Buyer,
};
