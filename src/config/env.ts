import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Auto-compose DATABASE_URL from individual POSTGRES_* variables
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
  DATABASE_URL: z.string({ message: 'DATABASE_URL is required.' }),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_SOCKET: z.string().optional(),
  REDIS_DB: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  // Email Configuration (Resend & SMTP)
  RESEND_API_KEY: z.string().optional(),
  SMTP_FROM: z.string().default('onboarding@resend.dev'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('465'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
