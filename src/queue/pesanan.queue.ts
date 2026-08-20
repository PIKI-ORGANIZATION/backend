import { Queue } from "bullmq";
import bullmqRedis from "../config/bullmqRedis";

export const orderQueue = new Queue(
  "order-automation",
  {
    connection: bullmqRedis,
  }
);