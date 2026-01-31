const session = require('express-session');
const { RedisStore } = require('connect-redis');
const redisClient = require('./redis');

const isProd = process.env.NODE_ENV === 'production';
const allowCrossSiteDev = process.env.ALLOW_CROSS_SITE_DEV === 'true';

const sameSite = allowCrossSiteDev ? 'none' : 'lax';
const secure = isProd && allowCrossSiteDev;

// create a RedisStore instance so other modules (sessionManager) can access it
const store = new RedisStore({
  client: redisClient,
  prefix: 'session:',
});

const sessionMiddleware = session({
  name: 'troo.sid',

  store,

  secret: process.env.SESSION_SECRET,

  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    secure: secure,
    sameSite: sameSite,
    maxAge: 1000 * 60 * 60 * 24,
  },
});

// preserve existing default export (the middleware) but also expose the store
module.exports = sessionMiddleware;
module.exports.store = store;