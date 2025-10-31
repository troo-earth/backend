const { Sequelize } = require('sequelize');
require('dotenv').config();
// rest of your app code

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: false, // Disable or customize logging as needed
});

module.exports = sequelize;
