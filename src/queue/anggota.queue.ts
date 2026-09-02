import { Queue } from "bullmq";
import bullmqRedis from "../config/bullmqRedis";

export const anggotaQueue = new Queue("anggota-io", {
  connection: bullmqRedis,
});
