import { createClient } from 'redis';

let redisClient = null;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL?.trim();

    // Skip Redis if not configured (optional dependency)
    if (!redisUrl) {
      console.log('⚠️  Redis URL not configured - caching disabled');
      return null;
    }

    // On cloud runtimes, localhost Redis is typically invalid unless Redis
    // runs in the same container. Disable cache instead of causing retries.
    if (
      process.env.NODE_ENV === 'production' &&
      /(localhost|127\.0\.0\.1)/i.test(redisUrl)
    ) {
      console.log('⚠️  REDIS_URL points to localhost in production - caching disabled');
      return null;
    }

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis max reconnection attempts reached');
            return false;
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
