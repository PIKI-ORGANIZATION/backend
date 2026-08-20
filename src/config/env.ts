import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Auto-compose DATABASE_URL from individual POSTGRES_* variables
// so you only need to maintain one set of credentials in .env
if (!process.env.DATABASE_URL) {
  const user = process.env.POSTGRES_USER;
  const pass = process.env.POSTGRES_PASSWORD;
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || '5432';
  const db   = process.env.POSTGRES_DB;

  if (user && pass && db) {
    const encodedPass = encodeURIComponent(pass);
    process.env.DATABASE_URL = `postgresql://${user}:${encodedPass}@${host}:${port}/${db}?schema=public`;
  }
}

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string({ message: 'DATABASE_URL is required. Set it directly or provide POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB.' }),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6380'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_SOCKET: z.string().optional(),
  REDIS_DB: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  // SMTP
  SMTP_TYPE: z.enum(['log', 'mail']).default('log'),
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@pnps.id'),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:5174'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
