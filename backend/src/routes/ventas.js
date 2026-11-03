import { Router } from 'express';
import { query, queryOne } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { registrarVenta } from '../services/ventaService.js';
import {
  asyncHandler,
  HttpError,
  optionalIsoDate,
  parseInteger,
} from '../utils/http.js';

const router = Router();

router.get('/productos', authenticate, asyncHandler(async (req, res) => {
  const productos = await query(
    `SELECT m.id, m.codigo, m.nombre, m.concentracion, m.presentacion, m.precio_venta, m.imagen,
            COALESCE(SUM(CASE WHEN l.estado = 'habilitado' AND l.fecha_vencimiento > CURDATE()
                              THEN l.cantidad_disponible ELSE 0 END), 0) AS stock
     FROM medicamentos m
     LEFT JOIN lotes l ON l.medicamento_id = m.id
     WHERE m.activo = 1
     GROUP BY m.id
     HAVING stock > 0
     ORDER BY m.nombre`,
  );
  res.json({ productos });
}));

router.post('/stock-check', authenticate, asyncHandler(async (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(422, 'El carrito está vacío.');
  }

  const normalized = new Map();
  for (const item of items) {
    const id = Number(item?.medicamento_id);
    const cantidad = Number(item?.cantidad);
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(cantidad) || cantidad < 1) {
      continue;
    }
    normalized.set(id, (normalized.get(id) || 0) + cantidad);
  }

  const result = [];
  let ok = true;

  for (const [medicamentoId, solicitado] of normalized) {
    const row = await queryOne(
      `SELECT m.nombre,
              COALESCE(SUM(CASE WHEN l.estado = 'habilitado' AND l.fecha_vencimiento > CURDATE()
                                THEN l.cantidad_disponible ELSE 0 END), 0) AS stock
       FROM medicamentos m
       LEFT JOIN lotes l ON l.medicamento_id = m.id
       WHERE m.id = ? AND m.activo = 1
       GROUP BY m.id`,
      [medicamentoId],
    );

    const disponible = Number(row?.stock || 0);
    const valido = Boolean(row) && disponible >= solicitado;
    if (!valido) ok = false;

    result.push({
      medicamento_id: medicamentoId,
      nombre: row?.nombre || 'Producto no disponible',
      solicitado,
      disponible,
      valido,
    });
  }

  res.json({
    ok,
    items: result,
    message: ok ? 'Stock confirmado.' : 'Uno o más productos ya no tienen stock suficiente.',
  });
}));

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const venta = await registrarVenta(req.body?.items, req.user.id, req.body);
  res.status(201).json({
    message: 'Venta registrada correctamente.',
    venta,
  });
}));

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const desde = optionalIsoDate(req.query.desde, 'desde');
  const hasta = optionalIsoDate(req.query.hasta, 'hasta');
  const buscar = String(req.query.q ?? '').trim();

  let sql = `SELECT v.*, u.nombres AS usuario,
                    (SELECT COUNT(*) FROM detalle_ventas d WHERE d.venta_id = v.id) AS items
             FROM ventas v
             JOIN usuarios u ON u.id = v.usuario_id
             WHERE 1 = 1`;
  const params = [];

  if (desde) {
    sql += ' AND DATE(v.creado_en) >= ?';
    params.push(desde);
  }
  if (hasta) {
    sql += ' AND DATE(v.creado_en) <= ?';
    params.push(hasta);
  }
  if (buscar) {
    sql += ' AND (v.numero LIKE ? OR v.cliente_nombre LIKE ?)';
    const like = `%${buscar}%`;
    params.push(like, like);
  }

  sql += ' ORDER BY v.id DESC LIMIT 500';
  const ventas = await query(sql, params);
  res.json({ ventas, desde, hasta, q: buscar });
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const id = parseInteger(req.params.id, 'identificador', { min: 1 });
  const venta = await queryOne(
    `SELECT v.*, u.nombres AS usuario
     FROM ventas v
     JOIN usuarios u ON u.id = v.usuario_id
     WHERE v.id = ? LIMIT 1`,
    [id],
  );
  if (!venta) throw new HttpError(404, 'Venta no encontrada.');

  const detalles = await query(
    `SELECT d.*, m.codigo, m.nombre,
            GROUP_CONCAT(CONCAT(l.numero_lote, ' (', dvl.cantidad, ')')
                         ORDER BY l.fecha_vencimiento SEPARATOR ', ') AS lotes
     FROM detalle_ventas d
     JOIN medicamentos m ON m.id = d.medicamento_id
     JOIN detalle_venta_lotes dvl ON dvl.detalle_venta_id = d.id
     JOIN lotes l ON l.id = dvl.lote_id
     WHERE d.venta_id = ?
     GROUP BY d.id
     ORDER BY d.id`,
    [id],
  );

  res.json({ venta, detalles });
}));

export default router;
