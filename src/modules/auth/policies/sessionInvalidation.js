const redisClient = require('../../../config/redis');

const destroyUserSessions = async (user_id) => {
  if (!user_id) return;

  const sessionKey = `user_sessions:${user_id}`;

  // Get all active session IDs for this user
  const sessionIds = await redisClient.sMembers(sessionKey);

  if (!sessionIds || sessionIds.length === 0) {
    return;
  }

  // Delete each session from Redis session store
  for (const sid of sessionIds) {
    await redisClient.del(`session:${sid}`);
  }

  // Remove the index
  await redisClient.del(sessionKey);
};

module.exports = { destroyUserSessions };
