require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database');

const userRoutes = require('./modules/user/userRoutes');
const marketplaceRoutes = require('./modules/marketplace/marketplaceRoutes');
const orgRoutes = require('./modules/org/orgRoutes');
const authRoutes = require('./modules/auth/authRoutes');
const listingRoutes = require('./modules/listing/listingRoutes');
const holdingsRoutes = require('./modules/holdings/holdingsRoutes');
const tradingRoutes = require('./modules/trading/tradingRoutes');
const uploadRoutes = require('./modules/uploads/uploadRoutes');
const transactionsRoutes = require('./modules/transactions/transactionsRoutes');
const retirementRoutes = require('./modules/reitrements/retirementRoutes');

const errorHandler = require('./middleware/errorHandler');
const responseFormatter = require('./middleware/responseFormatter');
const globalRouteLogger = require('./middleware/routeLogger');
const sessionMiddleware = require('./config/session');
const redisClient = require('./config/redis');
const authMiddelware = require('./middleware/authMiddleware');
const { tracingMiddleware } = require('./middleware/tracingMiddleware');
const { healthRouter, markRequest } = require('./utils/health');

const app = express();
const cors = require('cors');

//Stripe Webhook Handler Must exactly be placed here. DO NOT CHANGE THIS POSITION !!!
const { buildStripeWebhookExpressHandler } = require('./utils/stripe-webhook');

app.post(
  '/api/v1/stripe/webhook',
  express.raw({ type: 'application/json' }),
  buildStripeWebhookExpressHandler()
);

app.use((req, res, next) => {
  markRequest(req, res); 
  next();
});

// Middleware (same as before)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const devPassword = process.env.DEV_PASSWORD;

app.use((req, res, next) => {
  const allowedSuffix = process.env.FRONTEND_URL_ENDS_WITH;

  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // Allow preflight (OPTIONS) for localhost in dev without dev-password
      if (req.method === 'OPTIONS' && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        return callback(null, true);
      }

      // Priority: Check suffix first
      if (origin.toLowerCase().endsWith(allowedSuffix)) {
        return callback(null, true);
      }

      // Then dev password (single string equality check)
      const devPasswordHeader = req.headers['dev-password'];
      if (devPasswordHeader === devPassword) {
        return callback(null, true);
      } else {
        console.warn(`Blocked CORS from: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'dev-password'],
  })(req, res, next);
});

app.set('trust proxy', 1);
app.use(sessionMiddleware);
app.use(responseFormatter);
app.use(tracingMiddleware);
app.use(globalRouteLogger);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/', healthRouter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

app.use(authMiddelware);

app.use('/api/v1/orgs', orgRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/holdings', holdingsRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/trading', tradingRoutes);
app.use('/api/v1/transactions', transactionsRoutes);
app.use('/api/v1/retirements', retirementRoutes);

app.use(errorHandler);

// Conditional listen ONLY for local development
// Only start the server when running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/`);
  });
}

// REQUIRED for Vercel
module.exports = app;