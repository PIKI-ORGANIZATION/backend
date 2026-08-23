import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const envExamplePath = path.join(projectRoot, '.env.example');

// Auto-create .env from .env.example if .env does not exist yet
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('💡 File .env belum ada. Otomatis membuat .env dari .env.example');
}

// Read .env variables
const targetEnvFile = fs.existsSync(envPath) ? envPath : (fs.existsSync(envExamplePath) ? envExamplePath : null);
const extraEnv: Record<string, string> = {};

if (targetEnvFile && fs.existsSync(targetEnvFile)) {
  const content = fs.readFileSync(targetEnvFile, 'utf8');
  const lines = content.split(/\r?\n/);
  const parsedEnv: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)=["']?([^"']*)["']?$/);
    if (m) parsedEnv[m[1]] = m[2];
  }

  const u = parsedEnv.POSTGRES_USER;
  const p = encodeURIComponent(parsedEnv.POSTGRES_PASSWORD || '');
  const h = parsedEnv.POSTGRES_HOST || 'localhost';
  const port = parsedEnv.POSTGRES_PORT || '5432';
  const db = parsedEnv.POSTGRES_DB;

  let dbUrl = parsedEnv.DATABASE_URL;
  if (!dbUrl && u && db) {
    dbUrl = `postgresql://${u}:${p}@${h}:${port}/${db}?schema=public`;
  }

  if (dbUrl) {
    extraEnv.DATABASE_URL = dbUrl;
  }
}

// Execute command passed in arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const result = spawnSync(args[0], args.slice(1), {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
  process.exit(result.status ?? 0);
}
