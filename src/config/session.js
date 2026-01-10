const session = require('express-session');
const { RedisStore } = require('connect-redis');
const redisClient = require('./redis');

const isProd = process.env.NODE_ENV === 'production';
const allowCrossSiteDev = process.env.ALLOW_CROSS_SITE_DEV === 'true';

const sameSite =
  allowCrossSiteDev ? 'none' : 'lax';

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
    secure: false,
    sameSite: sameSite,
    maxAge: 1000 * 60 * 60 * 24
  }
  ,
});

module.exports = sessionMiddleware;
