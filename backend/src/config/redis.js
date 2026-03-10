import { createClient } from 'redis';

let redisClient = null;

const connectRedis = async () => {
  try {
    // Skip Redis if not configured (optional dependency)
    if (!process.env.REDIS_URL) {
      console.log('⚠️  Redis URL not configured - caching disabled');
      return null;
    }

    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis max reconnection attempts reached');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('🔄 Connecting to Redis...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis Connected and Ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis Reconnecting...');
    });

    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    console.error('❌ Redis Connection Error:', error.message);
    console.log('⚠️  Continuing without Redis cache');
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
};

export { connectRedis, getRedisClient, closeRedis };
