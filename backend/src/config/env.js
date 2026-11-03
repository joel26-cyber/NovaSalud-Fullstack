import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const backendRoot = path.resolve(currentDir, '../..');
export const projectRoot = path.resolve(backendRoot, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

const int = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: int(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: int(process.env.DB_PORT, 3306),
    database: process.env.DB_NAME || 'bd_botica',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
  },
  jwtSecret: process.env.JWT_SECRET || 'novasalud-dev-secret',
  jwtExpires: process.env.JWT_EXPIRES || '8h',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  admin: {
    nombres: process.env.ADMIN_NOMBRES || 'Administrador Nova Salud',
    usuario: process.env.ADMIN_USUARIO || 'admin',
    password: process.env.ADMIN_PASSWORD || 'NovaSalud2026',
  },
  seller: {
    nombres: process.env.SELLER_NOMBRES || 'Vendedor Nova Salud',
    usuario: process.env.SELLER_USUARIO || 'vendedor',
    password: process.env.SELLER_PASSWORD || 'Vendedor2026',
  },
  uploadDir: path.join(backendRoot, 'uploads'),
  assetsDir: path.join(backendRoot, 'assets'),
  frontendDist: path.join(projectRoot, 'frontend', 'dist'),
  timezone: 'America/Lima',
  currency: 'S/',
};
