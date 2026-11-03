import app from './app.js';
import { env } from './config/env.js';
import { checkDatabase, pool } from './config/db.js';

async function start() {
  try {
    await checkDatabase();
    console.log(`[DB] Conectado a MySQL ${env.db.host}:${env.db.port}/${env.db.database}`);
  } catch (error) {
    console.error('[DB] No se pudo conectar a MySQL.');
    console.error(error.message);
    console.error('Verifica que MySQL esté iniciado y que backend/.env tenga credenciales válidas.');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`[API] Nova Salud escuchando en http://localhost:${env.port}`);
    console.log(`[API] Frontend React (dev): http://localhost:5173`);
  });

  const shutdown = async () => {
    console.log('\n[API] Cerrando servidor...');
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
