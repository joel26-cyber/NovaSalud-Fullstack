import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { query, queryOne } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError, requiredString } from '../utils/http.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de acceso. Espera unos minutos e inténtalo nuevamente.' },
});

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const usuario = requiredString(req.body?.usuario, 'usuario', { min: 1, max: 50 });
  const password = String(req.body?.password ?? '');

  if (!password) throw new HttpError(422, 'Ingresa tu contraseña.');

  const user = await queryOne(
    `SELECT u.id, u.nombres, u.usuario, u.password_hash, u.activo, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.usuario = ? LIMIT 1`,
    [usuario],
  );

  if (!user || Number(user.activo) !== 1) {
    throw new HttpError(401, 'Usuario o contraseña incorrectos.');
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new HttpError(401, 'Usuario o contraseña incorrectos.');
  }

  await query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [user.id]);

  const publicUser = {
    id: Number(user.id),
    nombres: user.nombres,
    usuario: user.usuario,
    rol: user.rol,
  };

  const token = jwt.sign({ id: publicUser.id }, env.jwtSecret, { expiresIn: env.jwtExpires });

  res.json({ token, user: publicUser });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  res.json({ message: 'Sesión cerrada correctamente.' });
}));

export default router;
