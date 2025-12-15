const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('./config')[env];

// Add this line to fix pg driver on Vercel
config.dialectModule = require('pg');

const sequelize = new Sequelize(config.url, config);

module.exports = sequelize;