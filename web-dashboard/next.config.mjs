import createNextIntlPlugin from 'next-intl/plugin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const withNextIntl = createNextIntlPlugin();
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadRootEnv() {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    process.env[key.trim()] ??= valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
}

loadRootEnv();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: requiredEnv("NEXT_PUBLIC_API_URL"),
    NEXT_PUBLIC_CAMERA_STREAM_URL: requiredEnv("CAMERA_STREAM_URL"),
  },
};

export default withNextIntl(nextConfig);

