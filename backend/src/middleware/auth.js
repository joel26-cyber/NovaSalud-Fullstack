import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { queryOne } from '../config/db.js';
import { HttpError } from '../utils/http.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw new HttpError(401, 'Debes iniciar sesión para continuar.');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) throw new HttpError(401, 'Debes iniciar sesión para continuar.');

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpError(401, 'La sesión expiró. Vuelve a iniciar sesión.');
      }
      throw new HttpError(401, 'La sesión no es válida. Vuelve a iniciar sesión.');
    }

    const user = await queryOne(
      `SELECT u.id, u.nombres, u.usuario, u.activo, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = ? LIMIT 1`,
      [payload.id],
    );

    if (!user || Number(user.activo) !== 1) {
      throw new HttpError(401, 'La cuenta no está disponible.');
    }

    req.user = {
      id: Number(user.id),
      nombres: user.nombres,
      usuario: user.usuario,
      rol: user.rol,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.rol !== 'administrador') {
    return next(new HttpError(403, 'No tienes permiso para esta acción.'));
  }
  next();
}
