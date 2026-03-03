import Redis from "ioredis";

let client;

export const initRedis = () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("REDIS_URL missing. Running without Redis cache.");
    return null;
  }

  client = new Redis(redisUrl, { maxRetriesPerRequest: 2 });
  client.on("error", (error) => console.warn("Redis unavailable:", error.message));
  return client;
};

export const getRedis = () => client;
