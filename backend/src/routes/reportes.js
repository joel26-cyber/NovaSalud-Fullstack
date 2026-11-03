import { Router } from 'express';
import path from 'node:path';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { buildReportPdf } from '../services/pdfReport.js';
import {
  asyncHandler,
  isValidIsoDate,
} from '../utils/http.js';
import {
  isoToDisplay,
  isoToDisplayDateTime,
  timestampForFile,
  todayIso,
} from '../utils/dates.js';

const router = Router();

function periodo(req) {
  const firstDay = `${todayIso().slice(0, 8)}01`;
  let desde = String(req.query.desde ?? '');
  let hasta = String(req.query.hasta ?? '');

  if (!isValidIsoDate(desde)) desde = firstDay;
  if (!isValidIsoDate(hasta)) hasta = todayIso();
  if (desde > hasta) [desde, hasta] = [hasta, desde];

  return { desde, hasta };
}

function tipo(req) {
  return req.query.tipo === 'stock' ? 'stock' : 'ventas';
}

async function ventasRows(desde, hasta) {
  return query(
    `SELECT v.numero, v.creado_en, u.nombres, v.cliente_nombre, v.metodo_pago, v.total
     FROM ventas v
     JOIN usuarios u ON u.id = v.usuario_id
     WHERE v.estado = 'completada' AND DATE(v.creado_en) BETWEEN ? AND ?
     ORDER BY v.creado_en ASC`,
    [desde, hasta],
  );
}

async function stockRows() {
  return query(
    `SELECT m.codigo, m.nombre, m.stock_minimo,
            COALESCE(SUM(CASE WHEN l.estado = 'habilitado' AND l.fecha_vencimiento >= CURDATE()
                              THEN l.cantidad_disponible ELSE 0 END), 0) AS stock
     FROM medicamentos m
     LEFT JOIN lotes l ON l.medicamento_id = m.id
     WHERE m.activo = 1
     GROUP BY m.id
     ORDER BY m.nombre`,
  );
}

function csvValue(value) {
  const text = String(value ?? '');
  if (/[;"\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function toCsv(rows, headers) {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvValue).join(';')).join('\r\n')}`;
}

router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { desde, hasta } = periodo(req);

  const diarias = await query(
    `SELECT DATE(creado_en) AS fecha, COUNT(*) AS ventas, COALESCE(SUM(total), 0) AS total
     FROM ventas
     WHERE estado = 'completada' AND DATE(creado_en) BETWEEN ? AND ?
     GROUP BY DATE(creado_en)
     ORDER BY fecha DESC`,
    [desde, hasta],
  );

  const productos = await query(
    `SELECT m.codigo, m.nombre, SUM(d.cantidad) AS cantidad, COALESCE(SUM(d.subtotal), 0) AS importe
     FROM detalle_ventas d
     JOIN ventas v ON v.id = d.venta_id
     JOIN medicamentos m ON m.id = d.medicamento_id
     WHERE v.estado = 'completada' AND DATE(v.creado_en) BETWEEN ? AND ?
     GROUP BY m.id
     ORDER BY cantidad DESC
     LIMIT 20`,
    [desde, hasta],
  );

  res.json({ diarias, productos, desde, hasta });
}));

router.get('/csv', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { desde, hasta } = periodo(req);
  const reportType = tipo(req);

  let csv;
  if (reportType === 'stock') {
    const rows = await stockRows();
    csv = toCsv(
      rows.map((row) => [row.codigo, row.nombre, row.stock_minimo, row.stock]),
      ['Código', 'Medicamento', 'Stock mínimo', 'Stock disponible'],
    );
  } else {
    const rows = await ventasRows(desde, hasta);
    csv = toCsv(
      rows.map((row) => [
        row.numero,
        isoToDisplayDateTime(row.creado_en),
        row.nombres,
        row.cliente_nombre || 'Público general',
        String(row.metodo_pago || '').charAt(0).toUpperCase() + String(row.metodo_pago || '').slice(1),
        Number(row.total).toFixed(2),
      ]),
      ['Venta', 'Fecha', 'Usuario', 'Cliente', 'Método', 'Total'],
    );
  }

  const filename = `reporte_${reportType}_${timestampForFile()}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}));

router.get('/pdf', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { desde, hasta } = periodo(req);
  const reportType = tipo(req);
  const logoPath = path.join(env.assetsDir, 'logo-report.jpg');

  let pdf;
  let filename;

  if (reportType === 'stock') {
    const source = await stockRows();
    const available = source.reduce((sum, row) => sum + Number(row.stock), 0);
    pdf = await buildReportPdf({
      title: 'Reporte de stock',
      subtitle: `Inventario disponible al ${isoToDisplay(todayIso())}`,
      headers: ['Código', 'Medicamento', 'Stock mínimo', 'Disponible'],
      widths: [82, 235, 96, 98],
      alignments: ['left', 'left', 'center', 'center'],
      rows: source.map((row) => [row.codigo, row.nombre, String(row.stock_minimo), String(row.stock)]),
      summary: `Productos activos: ${source.length}  |  Unidades disponibles: ${available}`,
      logoPath,
    });
    filename = `reporte_stock_${timestampForFile()}.pdf`;
  } else {
    const source = await ventasRows(desde, hasta);
    const total = source.reduce((sum, row) => sum + Number(row.total), 0);
    pdf = await buildReportPdf({
      title: 'Reporte de ventas',
      subtitle: `Periodo: ${isoToDisplay(desde)} al ${isoToDisplay(hasta)}`,
      headers: ['Venta', 'Fecha', 'Usuario', 'Cliente', 'Método', 'Total'],
      widths: [105, 80, 94, 88, 69, 75],
      alignments: ['left', 'left', 'left', 'left', 'left', 'right'],
      rows: source.map((row) => [
        row.numero,
        isoToDisplayDateTime(row.creado_en),
        row.nombres,
        row.cliente_nombre || 'Público general',
        String(row.metodo_pago || '').charAt(0).toUpperCase() + String(row.metodo_pago || '').slice(1),
        `S/ ${Number(row.total).toFixed(2)}`,
      ]),
      summary: `Ventas completadas: ${source.length}  |  Ingresos: S/ ${total.toFixed(2)}`,
      logoPath,
    });
    filename = `reporte_ventas_${timestampForFile()}.pdf`;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdf.length);
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  res.send(pdf);
}));

export default router;
