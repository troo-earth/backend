const redisClient = require('../config/redis');
const sessionConfig = require('../config/session');

const SESSION_SET_PREFIX = 'user_sessions:'; // Redis set per user storing session IDs
const SESSION_TTL = 1000 * 60 * 60 * 24; // 24 hours - match session cookie maxAge

function sessionSetKey(userId) {
  return `${SESSION_SET_PREFIX}${userId}`;
}

async function addSessionForUser(userId, sessionId) {
  if (!userId || !sessionId) return;
  try {
    const key = sessionSetKey(userId);
    await redisClient.sAdd(key, sessionId);
    
    // Set/refresh expiry on the user session set to match session TTL
    // This ensures the set doesn't grow unbounded with stale session IDs
    await redisClient.expire(key, Math.floor(SESSION_TTL / 1000)); // Redis expects seconds
  } catch (e) {
    console.error('Failed to add session for user', e.message || e);
  }
}

async function removeSessionForUser(userId, sessionId) {
  if (!userId || !sessionId) return;
  try {
    const key = sessionSetKey(userId);
    await redisClient.sRem(key, sessionId);
    
    // Check if set is now empty and clean up if so
    const remainingCount = await redisClient.sCard(key);
    if (remainingCount === 0) {
      await redisClient.del(key);
    } else {
      // Refresh expiry since user still has active sessions
      await redisClient.expire(key, Math.floor(SESSION_TTL / 1000));
    }
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
        await new Promise((resolve, reject) => {
          store.destroy(sid, (err) => {
            if (err) {
              console.error('Error from session store while destroying session', sid, err.message || err);
              return reject(err);
            }
            resolve();
          });
        });
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

/**
 * Clean up stale session IDs from user session sets
 * This removes session IDs that no longer exist in the session store
 * Call periodically or when needed to prevent memory bloat
 */
async function cleanupStaleSessionsForUser(userId) {
  if (!userId) return;
  try {
    const key = sessionSetKey(userId);
    const sessionIds = await redisClient.sMembers(key);
    
    if (!sessionIds || sessionIds.length === 0) {
      return;
    }

    const store = sessionConfig.store;
    if (!store) {
      console.error('Session store not available for cleanup');
      return;
    }

    const staleSessionIds = [];
    
    // Check which session IDs no longer exist in the session store
    for (const sid of sessionIds) {
      try {
        await new Promise((resolve, reject) => {
          store.get(sid, (err, session) => {
            if (err) return reject(err);
            if (!session) {
              staleSessionIds.push(sid); // Session doesn't exist, mark as stale
            }
            resolve();
          });
        });
      } catch (e) {
        // If we can't check, assume stale to be safe
        staleSessionIds.push(sid);
      }
    }

    // Remove stale session IDs from the set
    if (staleSessionIds.length > 0) {
      await redisClient.sRem(key, ...staleSessionIds);
      console.log(`Cleaned up ${staleSessionIds.length} stale session IDs for user ${userId}`);
      
      // Check if set is now empty and clean up
      const remainingCount = await redisClient.sCard(key);
      if (remainingCount === 0) {
        await redisClient.del(key);
      } else {
        // Refresh expiry since user still has active sessions
        await redisClient.expire(key, Math.floor(SESSION_TTL / 1000));
      }
    }
  } catch (e) {
    console.error('Failed to cleanup stale sessions for user', e.message || e);
  }
}

module.exports = {
  addSessionForUser,
  removeSessionForUser,
  getSessionsForUser,
  invalidateSessionsForUser,
  cleanupStaleSessionsForUser,
};
