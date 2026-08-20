import { Queue } from "bullmq";
import bullmqRedis from "../config/bullmqRedis";

export const seniorQueue = new Queue("senior-io", {
  connection: bullmqRedis,
});
