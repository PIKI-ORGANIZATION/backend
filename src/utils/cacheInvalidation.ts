import redisClient from "../config/redis";

/**
 * Clears cached responses based on a key pattern.
 * This is crucial for cache invalidation after mutations (Create, Update, Delete).
 * 
 * @param pattern The redis key pattern to match (e.g., "cache:*:*news*")
 */
export const clearCachePattern = async (pattern: string) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Cleared ${keys.length} cache entries matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`Failed to clear cache for pattern ${pattern}:`, error);
  }
};
