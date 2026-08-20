import { createClient, RedisClientOptions } from 'redis';
import { env } from './env';

const options: RedisClientOptions = {
  password: env.REDIS_PASSWORD || undefined,
  database: env.REDIS_DB ? Number(env.REDIS_DB) : 0,
};

if (env.REDIS_SOCKET) {
  options.socket = { path: env.REDIS_SOCKET };
} else {
  options.socket = {
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
  };
}

const redisClient = createClient(options);

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
      await redisClient.connect();
  }
};

export default redisClient;
