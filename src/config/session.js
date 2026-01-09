const session = require('express-session');
const { RedisStore } = require('connect-redis');
const redisClient = require('./redis');

const isProd = process.env.NODE_ENV === 'production';

const sessionMiddleware = session({
  name: 'troo.sid',

  store: new RedisStore({
    client: redisClient,
    prefix: 'session:',
  }),

  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    secure: true,        // REQUIRED for SameSite=None
    sameSite: 'none',    // REQUIRED for localhost → api.troo.earth
    domain: '.troo.earth',
    maxAge: 1000 * 60 * 60 * 24
  },
});

module.exports = sessionMiddleware;
