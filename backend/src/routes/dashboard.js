import { Router } from 'express';
import { query, queryOne } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { lastNDays } from '../utils/dates.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const config = await queryOne(
    "SELECT valor FROM configuraciones WHERE clave = 'dias_alerta_vencimiento' LIMIT 1",
  );
  const dias = Number(config?.valor || 30);

  const [medicamentos, stock, ventas, ingresos, vencidos, proximos] = await Promise.all([
    queryOne('SELECT COUNT(*) AS total FROM medicamentos WHERE activo = 1'),
    queryOne("SELECT COALESCE(SUM(cantidad_disponible), 0) AS total FROM lotes WHERE estado = 'habilitado' AND fecha_vencimiento > CURDATE()"),
    queryOne("SELECT COUNT(*) AS total FROM ventas WHERE estado = 'completada' AND DATE(creado_en) = CURDATE()"),
    queryOne("SELECT COALESCE(SUM(total), 0) AS total FROM ventas WHERE estado = 'completada' AND DATE(creado_en) = CURDATE()"),
    queryOne('SELECT COUNT(*) AS total FROM lotes WHERE cantidad_disponible > 0 AND fecha_vencimiento <= CURDATE()'),
    queryOne(
      'SELECT COUNT(*) AS total FROM lotes WHERE cantidad_disponible > 0 AND fecha_vencimiento > CURDATE() AND fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY)',
      [dias],
    ),
  ]);

  const bajo = await query(
    `SELECT m.id, m.codigo, m.nombre, m.stock_minimo,
            COALESCE(SUM(CASE WHEN l.estado = 'habilitado' AND l.fecha_vencimiento > CURDATE()
                              THEN l.cantidad_disponible ELSE 0 END), 0) AS stock
     FROM medicamentos m
     LEFT JOIN lotes l ON l.medicamento_id = m.id
     WHERE m.activo = 1
     GROUP BY m.id
     HAVING stock <= m.stock_minimo
     ORDER BY stock ASC
     LIMIT 5`,
  );

  const ultimas = await query(
    `SELECT v.id, v.numero, v.total, v.creado_en, u.nombres
     FROM ventas v
     JOIN usuarios u ON u.id = v.usuario_id
     WHERE v.estado = 'completada'
     ORDER BY v.id DESC
     LIMIT 5`,
  );

  const days = lastNDays(7);
  const salesRows = await query(
    `SELECT DATE(creado_en) AS fecha, COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total
     FROM ventas
     WHERE estado = 'completada' AND creado_en >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(creado_en)`,
  );
  const salesByDate = new Map(salesRows.map((row) => [String(row.fecha).slice(0, 10), row]));
  const chartVentas = {
    labels: days.map((day) => day.label),
    ingresos: days.map((day) => Number(salesByDate.get(day.iso)?.total || 0)),
    ventas: days.map((day) => Number(salesByDate.get(day.iso)?.cantidad || 0)),
  };

  const categoryRows = await query(
    `SELECT c.nombre, COALESCE(SUM(l.cantidad_disponible), 0) AS stock
     FROM categorias c
     JOIN medicamentos m ON m.categoria_id = c.id AND m.activo = 1
     LEFT JOIN lotes l ON l.medicamento_id = m.id
       AND l.estado = 'habilitado' AND l.fecha_vencimiento > CURDATE()
     GROUP BY c.id
     ORDER BY stock DESC
     LIMIT 5`,
  );

  res.json({
    dias,
    stats: {
      medicamentos: Number(medicamentos?.total || 0),
      stock: Number(stock?.total || 0),
      ventas: Number(ventas?.total || 0),
      ingresos: Number(ingresos?.total || 0),
      vencidos: Number(vencidos?.total || 0),
      proximos: Number(proximos?.total || 0),
    },
    bajo,
    ultimas,
    chartVentas,
    chartCategorias: {
      labels: categoryRows.map((row) => row.nombre),
      stock: categoryRows.map((row) => Number(row.stock)),
    },
  });
}));

export default router;
