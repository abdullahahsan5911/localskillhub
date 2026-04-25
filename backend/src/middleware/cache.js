import { getRedisClient } from '../config/redis.js';

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds (default: 5 minutes)
 */
export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const redis = getRedisClient();
    
    // Skip caching if Redis is not available
    if (!redis || !redis.isOpen) {
      return next();
    }

    try {
      // Create cache key from URL and query params
      const cacheKey = `cache:${req.originalUrl || req.url}`;
      
      // Try to get cached data
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);
      
      // Store original res.json
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache the response
      res.json = (data) => {
        // Cache the response
        redis.setEx(cacheKey, duration, JSON.stringify(data))
          .catch(err => console.error('Cache set error:', err));
        
        // Send the response
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'cache:*\/api/freelancers*')
 */
export const clearCache = async (pattern) => {
  const redis = getRedisClient();
  
  if (!redis || !redis.isOpen) {
    return;
  }

  try {
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`🗑️  Cleared ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.error('Clear cache error:', error);
  }
};

/**
 * Clear specific cache key
 * @param {string} key - Exact cache key
 */
export const clearCacheKey = async (key) => {
  const redis = getRedisClient();
  
  if (!redis || !redis.isOpen) {
    return;
  }

  try {
    await redis.del(key);
    console.log(`🗑️  Cleared cache key: ${key}`);
  } catch (error) {
    console.error('Clear cache key error:', error);
  }
};

/**
 * Invalidate cache after data mutation
 * Use this in POST, PUT, DELETE handlers
 */
export const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    // Store original handlers
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Override response methods to invalidate cache after successful response
    const invalidateAfterResponse = (data) => {
      // Only invalidate on successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.all(
          patterns.map(pattern => clearCache(pattern))
        ).catch(err => console.error('Cache invalidation error:', err));
      }
      return data;
    };

    res.json = (data) => {
      invalidateAfterResponse(data);
      return originalJson(data);
    };

    res.send = (data) => {
      invalidateAfterResponse(data);
      return originalSend(data);
    };

    next();
  };
};

/**
 * Get or set cache with a function
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data if not cached
 * @param {number} duration - Cache duration in seconds
 */
export const getOrSetCache = async (key, fetchFn, duration = 300) => {
  const redis = getRedisClient();
  
  // If Redis is not available, just fetch the data
  if (!redis || !redis.isOpen) {
    return await fetchFn();
  }

  try {
    // Try to get from cache
    const cached = await redis.get(key);
    
    if (cached) {
      console.log(`✅ Cache HIT: ${key}`);
      return JSON.parse(cached);
    }

    console.log(`❌ Cache MISS: ${key}`);
    
    // Fetch fresh data
    const data = await fetchFn();
    
    // Store in cache
    await redis.setEx(key, duration, JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('Get or set cache error:', error);
    return await fetchFn();
  }
};
