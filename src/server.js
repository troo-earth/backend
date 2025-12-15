require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStoreInit = require('connect-session-sequelize');
const sequelize = require('./config/database');

const userRoutes = require('./modules/user/userRoutes');
const projectRoutes = require('./modules/project/projectRoutes');
const sellerRoutes = require('./modules/seller/sellerRoutes');
const marketplaceRoutes = require('./modules/marketplace/marketplaceRoutes');
const orgRoutes = require('./modules/org/orgRoutes');
const orgUserRoutes = require('./modules/orgUser/orgUserRoutes');
const buyerRoutes = require('./modules/buyer/buyerRoutes');

const errorHandler = require('./middleware/errorHandler');
const responseFormatter = require('./middleware/responseFormatter')
const globalRouteLogger = require('./middleware/routeLogger');

const { tracingMiddleware } = require('./middleware/tracingMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

const SequelizeStore = SequelizeStoreInit(session.Store);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Added for form data support (optional)

// Session setup — production-ready
app.use(session({
  secret: process.env.SESSION_SECRET || 'troo-earth-super-secret-2025', // Use env var!
  store: new SequelizeStore({
    db: sequelize,
    tableName: 'Sessions', // Auto-creates this table
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax',
  },
}));

app.use(responseFormatter);
app.use(tracingMiddleware);
app.use(globalRouteLogger);
app.use(errorHandler);

// Make session user available in all requests (optional but useful)
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

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
app.use('/api/v1/orgs', orgRoutes);
app.use('/api/v1/org-users', orgUserRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/buyer', buyerRoutes);

// Start Server
(async () => {
  try {
    // Test DB Connection + sync Sessions table
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // Safe: creates/alters Sessions if needed, no data loss
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