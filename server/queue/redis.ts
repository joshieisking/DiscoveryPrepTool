import Redis from 'ioredis';

// Create Redis connection with fallback to in-memory if Redis unavailable
export let redis: Redis | null = null;

export async function initializeRedis(): Promise<void> {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Test connection
    await redis.ping();
    console.log('Redis connected successfully');
  } catch (error) {
    console.warn('Redis connection failed, falling back to in-memory processing:', error);
    redis = null;
  }
}

export function getRedis(): Redis | null {
  return redis;
}