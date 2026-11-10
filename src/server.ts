import app from './app';
import { env } from './config/env';
import { connectRedis } from './config/redis';
import "./queue/anggota.worker";
import { startRegistrasiSlaScheduler } from "./jobs/registrasiSla.scheduler";

const startServer = async () => {
  try {
    await connectRedis();
    
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
      startRegistrasiSlaScheduler();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
