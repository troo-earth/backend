// src/app.js
require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database');

const userRoutes = require('./modules/user/userRoutes');
const projectRoutes = require('./modules/project/projectRoutes');
const sellerRoutes = require('./modules/seller/sellerRoutes');
const errorHandler = require('./middleware/errorHandler');
const responseFormatter = require('./middleware/responseFormatter')
const globalRouteLogger = require('./middleware/routeLogger');
const { tracingMiddleware } = require('./middleware/tracingMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(responseFormatter);
app.use(tracingMiddleware);
app.use(globalRouteLogger);

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

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/sellers', sellerRoutes);

app.use(errorHandler);

// Start Server
(async () => {
  try {
    // Test DB Connection
    await sequelize.authenticate();
    console.log('✅ **CONNECTED TO SUPABASE!** 🚀 (Env:', process.env.NODE_ENV || 'development', ')');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ **FAILED TO CONNECT TO SUPABASE:**', error.message);
    process.exit(1);
  }
})();