const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redisClient = require('./redis');

const sessionMiddleware = session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'session:',
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,        // set true only behind HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
});

module.exports = sessionMiddleware;
