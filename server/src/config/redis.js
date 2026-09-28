let connection = null;

function getRedisConnection() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!connection) {
    const IORedis = require("ioredis");

    connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true
    });

    connection.on("connect", () => {
      console.log("Redis connected");
    });

    connection.on("error", (error) => {
      console.error("Redis error:", error.message);
    });
  }

  return connection;
}

module.exports = { getRedisConnection };
