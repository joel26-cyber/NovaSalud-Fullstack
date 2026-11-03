import { Router } from 'express';
import { query, queryOne, withTransaction } from '../config/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  asyncHandler,
  HttpError,
  optionalIsoDate,
  parseInteger,
  requiredString,
} from '../utils/http.js';

const router = Router();

router.get('/lotes', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const lotes = await query(
    `SELECT l.id, l.numero_lote, l.cantidad_disponible, l.fecha_vencimiento, l.estado,
            m.nombre, m.codigo
     FROM lotes l
     JOIN medicamentos m ON m.id = l.medicamento_id
     ORDER BY m.nombre ASC, l.fecha_vencimiento ASC`,
  );
  res.json({ lotes });
}));

router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const tipo = ['entrada', 'ajuste_entrada', 'ajuste_salida', 'venta'].includes(req.query.tipo)
    ? req.query.tipo
    : '';
  const desde = optionalIsoDate(req.query.desde, 'desde');
  const hasta = optionalIsoDate(req.query.hasta, 'hasta');

  let sql = `SELECT mi.*, m.codigo, m.nombre, l.numero_lote, u.nombres AS usuario
             FROM movimientos_inventario mi
             JOIN medicamentos m ON m.id = mi.medicamento_id
             JOIN lotes l ON l.id = mi.lote_id
             JOIN usuarios u ON u.id = mi.usuario_id
             WHERE 1 = 1`;
  const params = [];

  if (tipo) {
    sql += ' AND mi.tipo = ?';
    params.push(tipo);
  }
  if (desde) {
    sql += ' AND DATE(mi.creado_en) >= ?';
    params.push(desde);
  }
  if (hasta) {
    sql += ' AND DATE(mi.creado_en) <= ?';
    params.push(hasta);
  }

  sql += ' ORDER BY mi.id DESC LIMIT 500';
  const movimientos = await query(sql, params);
  res.json({ movimientos, tipo, desde, hasta });
}));

router.post('/ajuste', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const loteId = parseInteger(req.body?.lote_id, 'lote', { min: 1 });
  const tipo = ['ajuste_entrada', 'ajuste_salida'].includes(req.body?.tipo)
    ? req.body.tipo
    : null;
  const cantidad = parseInteger(req.body?.cantidad, 'cantidad', { min: 1 });
  const motivo = requiredString(req.body?.motivo, 'motivo', { min: 4, max: 255 });

  if (!tipo) throw new HttpError(422, 'Selecciona un tipo de ajuste válido.');

  const result = await withTransaction(async (connection) => {
    const [rows] = await connection.query('SELECT * FROM lotes WHERE id = ? FOR UPDATE', [loteId]);
    const lote = rows[0];
    if (!lote) throw new HttpError(404, 'Lote no encontrado.');

    const anterior = Number(lote.cantidad_disponible);
    const posterior = tipo === 'ajuste_entrada' ? anterior + cantidad : anterior - cantidad;
    if (posterior < 0) throw new HttpError(409, 'El ajuste produciría stock negativo.');

    await connection.query(
      'UPDATE lotes SET cantidad_disponible = ?, cantidad_inicial = GREATEST(cantidad_inicial, ?) WHERE id = ?',
      [posterior, posterior, loteId],
    );

    const signedQuantity = tipo === 'ajuste_entrada' ? cantidad : -cantidad;
    await connection.query(
      `INSERT INTO movimientos_inventario
        (medicamento_id, lote_id, usuario_id, tipo, cantidad, stock_anterior, stock_posterior, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [lote.medicamento_id, loteId, req.user.id, tipo, signedQuantity, anterior, posterior, motivo],
    );

    return { stock_anterior: anterior, stock_posterior: posterior };
  });

  res.status(201).json({ message: 'Ajuste registrado correctamente.', ...result });
}));

export default router;
