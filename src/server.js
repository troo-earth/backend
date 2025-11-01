// src/app.js
require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');  // ← Uses config.js + index.js

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health Check + DB Status
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'API LIVE',
      database: 'SUPABASE CONNECTED',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'DB ERROR',
      error: err.message
    });
  }
});

// Start Server
(async () => {
  try {
    // Test DB Connection
    await sequelize.authenticate();
    console.log('CONNECTED TO SUPABASE! (Env:', process.env.NODE_ENV || 'development', ')');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('FAILED TO CONNECT TO SUPABASE:', error.message);
    process.exit(1);
  }
})();