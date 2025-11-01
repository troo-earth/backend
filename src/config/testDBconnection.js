// src/config/testDbConnection.js
require('dotenv').config();
const { sequelize } = require('../models');  // ← Now works!

// 🧪 Test
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ **CONNECTED TO SUPABASE!** 🚀');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}
testConnection();