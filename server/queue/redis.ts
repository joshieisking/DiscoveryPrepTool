import Redis from 'ioredis';

// Create Redis connection with fallback to in-memory if Redis unavailable
export let redis: Redis | null = null;

export async function initializeRedis(): Promise<void> {
  // Skip Redis entirely if environment variable indicates to use memory-only
  if (process.env.USE_MEMORY_QUEUE === 'true') {
    console.log('Memory queue mode enabled');
    return;
  }

  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 1000,
    });

    // Test connection immediately
    await redis.ping();
    console.log('Redis connected successfully');
  } catch (error) {
    console.log('Redis not available, using in-memory processing');
    if (redis) {
      redis.disconnect();
      redis = null;
    }
  }
}

export function getRedis(): Redis | null {
  return redis;
}