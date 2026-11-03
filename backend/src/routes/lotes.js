import { Router } from 'express';
import { query, queryOne, withTransaction } from '../config/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  asyncHandler,
  HttpError,
  isValidIsoDate,
  optionalIsoDate,
  parseInteger,
  requiredString,
} from '../utils/http.js';

const router = Router();

async function alertDays() {
  const config = await queryOne(
    "SELECT valor FROM configuraciones WHERE clave = 'dias_alerta_vencimiento' LIMIT 1",
  );
  return Number(config?.valor || 30);
}

router.get('/vencimientos', authenticate, asyncHandler(async (req, res) => {
  const dias = await alertDays();
  const estado = ['todos', 'vencido', 'proximo', 'vigente'].includes(req.query.estado)
    ? req.query.estado
    : 'todos';
  const medicamento = req.query.medicamento
    ? parseInteger(req.query.medicamento, 'medicamento', { min: 1 })
    : 0;
  const desde = optionalIsoDate(req.query.desde, 'desde');
  const hasta = optionalIsoDate(req.query.hasta, 'hasta');

  let sql = `SELECT l.*, m.codigo, m.nombre, DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias
             FROM lotes l
             JOIN medicamentos m ON m.id = l.medicamento_id
             WHERE l.cantidad_disponible > 0`;
  const params = [];

  if (estado === 'vencido') {
    sql += ' AND l.fecha_vencimiento <= CURDATE()';
  } else if (estado === 'proximo') {
    sql += ' AND l.fecha_vencimiento > CURDATE() AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY)';
    params.push(dias);
  } else if (estado === 'vigente') {
    sql += ' AND l.fecha_vencimiento > DATE_ADD(CURDATE(), INTERVAL ? DAY)';
    params.push(dias);
  }

  if (medicamento) {
    sql += ' AND l.medicamento_id = ?';
    params.push(medicamento);
  }
  if (desde) {
    sql += ' AND l.fecha_vencimiento >= ?';
    params.push(desde);
  }
  if (hasta) {
    sql += ' AND l.fecha_vencimiento <= ?';
    params.push(hasta);
  }

  sql += ' ORDER BY l.fecha_vencimiento ASC';
  const lotes = await query(sql, params);
  const medicamentos = await query(
    'SELECT id, nombre FROM medicamentos WHERE activo = 1 ORDER BY nombre',
  );

  res.json({ lotes, medicamentos, dias, estado, medicamento, desde, hasta });
}));

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const buscar = String(req.query.q ?? '').trim();
  let sql = `SELECT l.*, m.codigo, m.nombre, DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias
             FROM lotes l
             JOIN medicamentos m ON m.id = l.medicamento_id
             WHERE 1 = 1`;
  const params = [];

  if (buscar) {
    sql += ' AND (l.numero_lote LIKE ? OR m.nombre LIKE ? OR m.codigo LIKE ?)';
    const like = `%${buscar}%`;
    params.push(like, like, like);
  }

  sql += ' ORDER BY l.fecha_vencimiento ASC, l.id DESC';
  const lotes = await query(sql, params);
  res.json({ lotes });
}));

router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const medicamentoId = parseInteger(req.body?.medicamento_id, 'medicamento', { min: 1 });
  const numero = requiredString(req.body?.numero_lote, 'número de lote', { min: 1, max: 60 });
  const ingreso = optionalIsoDate(req.body?.fecha_ingreso, 'fecha de ingreso');
  const vencimiento = optionalIsoDate(req.body?.fecha_vencimiento, 'fecha de vencimiento');
  const cantidad = parseInteger(req.body?.cantidad, 'cantidad', { min: 1 });

  if (!ingreso || !vencimiento) {
    throw new HttpError(422, 'Las fechas de ingreso y vencimiento son obligatorias.');
  }
  if (vencimiento < ingreso) {
    throw new HttpError(422, 'La fecha de vencimiento no puede ser anterior a la fecha de ingreso.');
  }

  const medicamento = await queryOne(
    'SELECT id, nombre FROM medicamentos WHERE id = ? AND activo = 1 LIMIT 1',
    [medicamentoId],
  );
  if (!medicamento) throw new HttpError(422, 'El medicamento seleccionado no está disponible.');

  const result = await withTransaction(async (connection) => {
    const [insertResult] = await connection.query(
      `INSERT INTO lotes
        (medicamento_id, numero_lote, fecha_ingreso, fecha_vencimiento,
         cantidad_inicial, cantidad_disponible, usuario_registro_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [medicamentoId, numero, ingreso, vencimiento, cantidad, cantidad, req.user.id],
    );

    const loteId = insertResult.insertId;
    await connection.query(
      `INSERT INTO movimientos_inventario
        (medicamento_id, lote_id, usuario_id, tipo, cantidad, stock_anterior, stock_posterior, motivo)
       VALUES (?, ?, ?, 'entrada', ?, 0, ?, 'Registro de lote')`,
      [medicamentoId, loteId, req.user.id, cantidad, cantidad],
    );

    return { id: loteId };
  });

  res.status(201).json({ message: 'Lote e ingreso registrados correctamente.', lote: result });
}));

router.patch('/:id/toggle', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInteger(req.params.id, 'identificador', { min: 1 });
  const lote = await queryOne('SELECT id FROM lotes WHERE id = ? LIMIT 1', [id]);
  if (!lote) throw new HttpError(404, 'Lote no encontrado.');

  await query(
    "UPDATE lotes SET estado = IF(estado = 'habilitado', 'bloqueado', 'habilitado') WHERE id = ?",
    [id],
  );
  res.json({ message: 'Estado del lote actualizado.' });
}));

export default router;
