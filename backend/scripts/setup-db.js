import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { env, projectRoot } from '../src/config/env.js';

const schemaPath = path.join(projectRoot, 'database', 'BD_Botica.sql');
const seedPath = path.join(projectRoot, 'database', 'datos.sql');

async function main() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    charset: env.db.charset,
    multipleStatements: true,
  });

  try {
    const database = env.db.database.replace(/[^a-zA-Z0-9_]/g, '');
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE \`${database}\``);

    const schema = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schema);
    console.log('[DB] Esquema de tablas verificado.');

    const adminHash = await bcrypt.hash(env.admin.password, 10);
    const [existingAdmin] = await connection.query(
      'SELECT id FROM usuarios WHERE usuario = ? LIMIT 1',
      [env.admin.usuario],
    );
    if (!existingAdmin.length) {
      await connection.query(
        'INSERT INTO usuarios (rol_id, nombres, usuario, password_hash) VALUES (1, ?, ?, ?)',
        [env.admin.nombres, env.admin.usuario, adminHash],
      );
      console.log(`[DB] Administrador creado: ${env.admin.usuario} / ${env.admin.password}`);
    } else {
      console.log(`[DB] El administrador ${env.admin.usuario} ya existe; no se modificó su contraseña.`);
    }

    const sellerHash = await bcrypt.hash(env.seller.password, 10);
    const [existingSeller] = await connection.query(
      'SELECT id FROM usuarios WHERE usuario = ? LIMIT 1',
      [env.seller.usuario],
    );
    if (!existingSeller.length) {
      await connection.query(
        'INSERT INTO usuarios (rol_id, nombres, usuario, password_hash) VALUES (2, ?, ?, ?)',
        [env.seller.nombres, env.seller.usuario, sellerHash],
      );
      console.log(`[DB] Vendedor creado: ${env.seller.usuario} / ${env.seller.password}`);
    }

    const [medicamentos] = await connection.query('SELECT COUNT(*) AS total FROM medicamentos');
    if (Number(medicamentos[0].total) === 0) {
      const seed = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seed);
      console.log('[DB] Datos demostrativos cargados (20 medicamentos y lotes de ejemplo).');
    } else {
      console.log(`[DB] La base ya contiene ${medicamentos[0].total} medicamentos; no se duplicaron datos.`);
    }

    console.log('[DB] Instalación completada. Ya puedes iniciar el backend con: npm run dev');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('[DB] Error durante la instalación:', error.message);
  process.exit(1);
});
