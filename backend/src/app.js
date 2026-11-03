import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import medicamentosRoutes from './routes/medicamentos.js';
import lotesRoutes from './routes/lotes.js';
import inventarioRoutes from './routes/inventario.js';
import ventasRoutes from './routes/ventas.js';
import reportesRoutes from './routes/reportes.js';
import usuariosRoutes from './routes/usuarios.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use('/uploads', express.static(env.uploadDir, {
  maxAge: '1d',
  fallthrough: true,
  index: false,
}));
app.use('/uploads', (req, res) => {
  res.status(404).json({ message: 'Imagen no encontrada.' });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'Nova Salud API', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/medicamentos', medicamentosRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.use('/api', notFoundHandler);

if (fs.existsSync(env.frontendDist)) {
  app.use(express.static(env.frontendDist, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    return res.sendFile(path.join(env.frontendDist, 'index.html'));
  });
}

app.use(errorHandler);

export default app;
