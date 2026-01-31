const redisClient = require('../config/redis');
const sessionConfig = require('../config/session');

const SESSION_SET_PREFIX = 'user_sessions:'; // Redis set per user storing session IDs

function sessionSetKey(userId) {
  return `${SESSION_SET_PREFIX}${userId}`;
}

async function addSessionForUser(userId, sessionId) {
  if (!userId || !sessionId) return;
  try {
    await redisClient.sAdd(sessionSetKey(userId), sessionId);
  } catch (e) {
    console.error('Failed to add session for user', e.message || e);
  }
}

async function removeSessionForUser(userId, sessionId) {
  if (!userId || !sessionId) return;
  try {
    await redisClient.sRem(sessionSetKey(userId), sessionId);
  } catch (e) {
    console.error('Failed to remove session for user', e.message || e);
  }
}

async function getSessionsForUser(userId) {
  if (!userId) return [];
  try {
    const members = await redisClient.sMembers(sessionSetKey(userId));
    return members || [];
  } catch (e) {
    console.error('Failed to get sessions for user', e.message || e);
    return [];
  }
}

async function invalidateSessionsForUser(userId) {
  if (!userId) return;
  try {
    const sessions = await getSessionsForUser(userId);
    const store = sessionConfig.store;
    if (!store) {
      console.error('Session store not available to invalidate sessions');
      return;
    }

    // destroy each session id and remove from set
    for (const sid of sessions) {
      try {
        // connect-redis expects the session id without prefix
        await new Promise((resolve) => store.destroy(sid, (err) => resolve()));
      } catch (e) {
        console.error('Failed to destroy session', sid, e.message || e);
      }
    }

    // remove the set key entirely
    await redisClient.del(sessionSetKey(userId));
  } catch (e) {
    console.error('Failed to invalidate sessions for user', e.message || e);
  }
}

module.exports = {
  addSessionForUser,
  removeSessionForUser,
  getSessionsForUser,
  invalidateSessionsForUser,
};
