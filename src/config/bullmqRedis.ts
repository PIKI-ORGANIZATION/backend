import IORedis from "ioredis";
import { env } from "./env";

const bullmqRedis = new IORedis({
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  password: env.REDIS_PASSWORD || undefined,
  db: Number(env.REDIS_DB || 0),

  maxRetriesPerRequest: null,
});

bullmqRedis.on("connect", () => {
  console.log("BullMQ Redis Connected");
});

bullmqRedis.on("error", (err) => {
  console.log("BullMQ Redis Error", err);
});

export default bullmqRedis;