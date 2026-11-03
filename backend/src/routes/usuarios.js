import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  asyncHandler,
  HttpError,
  parseInteger,
  requiredString,
} from '../utils/http.js';

const router = Router();

router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const usuarios = await query(
    `SELECT u.id, u.nombres, u.usuario, u.activo, u.ultimo_acceso, u.creado_en, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     ORDER BY u.nombres`,
  );

  const config = await queryOne(
    "SELECT valor FROM configuraciones WHERE clave = 'dias_alerta_vencimiento' LIMIT 1",
  );

  res.json({ usuarios, dias: Number(config?.valor || 30) });
}));

router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const nombres = requiredString(req.body?.nombres, 'nombres', { min: 3, max: 100 });
  const usuario = requiredString(req.body?.usuario, 'usuario', { min: 4, max: 30 });
  const clave = String(req.body?.clave ?? '');
  const rolId = parseInteger(req.body?.rol_id, 'rol', { min: 1, max: 2 });

  if (!/^[A-Za-z0-9_.-]{4,30}$/.test(usuario)) {
    throw new HttpError(422, 'El usuario debe tener entre 4 y 30 caracteres y solo puede usar letras, números, punto, guion o guion bajo.');
  }
  if (clave.length < 10) {
    throw new HttpError(422, 'La contraseña debe tener al menos 10 caracteres.');
  }

  const hash = await bcrypt.hash(clave, 10);

  try {
    const result = await query(
      'INSERT INTO usuarios (rol_id, nombres, usuario, password_hash) VALUES (?, ?, ?, ?)',
      [rolId, nombres, usuario, hash],
    );
    const created = await queryOne(
      `SELECT u.id, u.nombres, u.usuario, u.activo, u.ultimo_acceso, u.creado_en, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.id = ?`,
      [result.insertId],
    );
    res.status(201).json({ message: 'Usuario creado correctamente.', usuario: created });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'El nombre de usuario ya está registrado.');
    }
    throw error;
  }
}));

router.put('/config', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const dias = parseInteger(req.body?.dias, 'días de anticipación', { min: 1, max: 365 });

  await query(
    `INSERT INTO configuraciones (clave, valor, descripcion)
     VALUES ('dias_alerta_vencimiento', ?, 'Días de anticipación para alertar vencimientos')
     ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
    [dias],
  );

  res.json({ message: 'Configuración actualizada correctamente.', dias });
}));

export default router;
