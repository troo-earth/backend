require('dotenv').config();
const express = require('express');
const session = require('express-session');
let MemoryStore = require('express-session').MemoryStore;
const SequelizeStoreInit = require('connect-session-sequelize');
const sequelize = require('./config/database');

const userRoutes = require('./modules/user/userRoutes');
const projectRoutes = require('./modules/project/projectRoutes');
const sellerRoutes = require('./modules/seller/sellerRoutes');
const marketplaceRoutes = require('./modules/marketplace/marketplaceRoutes');
const orgRoutes = require('./modules/org/orgRoutes');
const orgUserRoutes = require('./modules/orgUser/orgUserRoutes');
const buyerRoutes = require('./modules/buyer/buyerRoutes');
const paymentRoutes = require('./modules/payments/paymentRoutes');

const errorHandler = require('./middleware/errorHandler');
const responseFormatter = require('./middleware/responseFormatter');
const globalRouteLogger = require('./middleware/routeLogger');
const { tracingMiddleware } = require('./middleware/tracingMiddleware');

const app = express();
const cors = require('cors');

const SequelizeStore = SequelizeStoreInit(session.Store);

// Middleware (same as before)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

let sessionStore;

if (process.env.VERCEL) {
  // On Vercel: Use memory store (sessions won't persist across instances)
  sessionStore = new MemoryStore();
  console.warn('⚠️  Running on Vercel – using MemoryStore for sessions (short-lived)');
} else {
  // Locally: Keep your DB store
  const SequelizeStore = SequelizeStoreInit(session.Store);
  sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'Sessions',
  });
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'troo-earth-super-secret-2025',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true on Vercel production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax',
  },
}));

app.use(responseFormatter);
app.use(tracingMiddleware);
app.use(globalRouteLogger);
app.use(errorHandler);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'API LIVE',
      database: 'SUPABASE CONNECTED',
      // ...
    });
  } catch (err) {
    res.status(500).json({
      status: 'DB ERROR',
      // ...
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
app.use('/api/v1/payments', paymentRoutes);

// Conditional listen ONLY for local development
// Only start the server when running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

// REQUIRED for Vercel
module.exports = app;