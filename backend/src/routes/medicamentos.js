import { Router } from 'express';
import { query, queryOne } from '../config/db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadImage, removeUploadedFile } from '../middleware/upload.js';
import {
  asyncHandler,
  HttpError,
  optionalString,
  parseInteger,
  parseNumber,
  requiredString,
} from '../utils/http.js';

const router = Router();

function validateMedicamento(body) {
  return {
    categoria_id: parseInteger(body?.categoria_id, 'categoría', { min: 1 }),
    codigo: requiredString(body?.codigo, 'código', { min: 1, max: 30 }).toUpperCase(),
    nombre: requiredString(body?.nombre, 'nombre', { min: 1, max: 120 }),
    concentracion: optionalString(body?.concentracion, 80),
    presentacion: optionalString(body?.presentacion, 80),
    laboratorio: optionalString(body?.laboratorio, 120),
    precio_venta: parseNumber(body?.precio_venta, 'precio de venta', { min: 0 }),
    stock_minimo: parseInteger(body?.stock_minimo, 'stock mínimo', { min: 0 }),
  };
}

async function assertCategoria(categoriaId) {
  const categoria = await queryOne('SELECT id FROM categorias WHERE id = ? AND activo = 1 LIMIT 1', [categoriaId]);
  if (!categoria) throw new HttpError(422, 'La categoría seleccionada no está disponible.');
}

router.get('/categorias', authenticate, asyncHandler(async (req, res) => {
  const categorias = await query('SELECT id, nombre, descripcion FROM categorias WHERE activo = 1 ORDER BY nombre');
  res.json({ categorias });
}));

router.get('/options', authenticate, asyncHandler(async (req, res) => {
  const medicamentos = await query(
    'SELECT id, codigo, nombre FROM medicamentos WHERE activo = 1 ORDER BY nombre',
  );
  res.json({ medicamentos });
}));

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const buscar = String(req.query.q ?? '').trim();
  const categoria = req.query.categoria ? parseInteger(req.query.categoria, 'categoría', { min: 1 }) : 0;

  let sql = `SELECT m.id, m.categoria_id, m.codigo, m.nombre, m.concentracion, m.presentacion,
                    m.laboratorio, m.precio_venta, m.stock_minimo, m.imagen, m.activo,
                    m.creado_en, m.actualizado_en, c.nombre AS categoria,
                    COALESCE(SUM(CASE WHEN l.estado = 'habilitado' AND l.fecha_vencimiento > CURDATE()
                                      THEN l.cantidad_disponible ELSE 0 END), 0) AS stock
             FROM medicamentos m
             JOIN categorias c ON c.id = m.categoria_id
             LEFT JOIN lotes l ON l.medicamento_id = m.id
             WHERE 1 = 1`;
  const params = [];

  if (buscar) {
    sql += ' AND (m.nombre LIKE ? OR m.codigo LIKE ? OR m.laboratorio LIKE ?)';
    const like = `%${buscar}%`;
    params.push(like, like, like);
  }
  if (categoria) {
    sql += ' AND m.categoria_id = ?';
    params.push(categoria);
  }

  sql += ' GROUP BY m.id ORDER BY m.nombre';
  const medicamentos = await query(sql, params);
  res.json({ medicamentos });
}));

router.get('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInteger(req.params.id, 'identificador', { min: 1 });
  const medicamento = await queryOne('SELECT * FROM medicamentos WHERE id = ? LIMIT 1', [id]);
  if (!medicamento) throw new HttpError(404, 'Medicamento no encontrado.');
  res.json({ medicamento });
}));

router.post('/', authenticate, requireAdmin, uploadImage.single('imagen'), asyncHandler(async (req, res) => {
  try {
    const data = validateMedicamento(req.body);
    await assertCategoria(data.categoria_id);

    const result = await query(
      `INSERT INTO medicamentos
        (categoria_id, codigo, nombre, concentracion, presentacion, laboratorio, precio_venta, stock_minimo, imagen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.categoria_id,
        data.codigo,
        data.nombre,
        data.concentracion,
        data.presentacion,
        data.laboratorio,
        data.precio_venta,
        data.stock_minimo,
        req.file?.filename ?? null,
      ],
    );

    const medicamento = await queryOne('SELECT * FROM medicamentos WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Medicamento guardado correctamente.', medicamento });
  } catch (error) {
    removeUploadedFile(req.file?.filename);
    throw error;
  }
}));

router.put('/:id', authenticate, requireAdmin, uploadImage.single('imagen'), asyncHandler(async (req, res) => {
  const id = parseInteger(req.params.id, 'identificador', { min: 1 });
  try {
    const data = validateMedicamento(req.body);
    await assertCategoria(data.categoria_id);

    const existing = await queryOne('SELECT * FROM medicamentos WHERE id = ? LIMIT 1', [id]);
    if (!existing) throw new HttpError(404, 'Medicamento no encontrado.');

    const image = req.file?.filename ?? existing.imagen;
    await query(
      `UPDATE medicamentos
       SET categoria_id = ?, codigo = ?, nombre = ?, concentracion = ?, presentacion = ?,
           laboratorio = ?, precio_venta = ?, stock_minimo = ?, imagen = ?
       WHERE id = ?`,
      [
        data.categoria_id,
        data.codigo,
        data.nombre,
        data.concentracion,
        data.presentacion,
        data.laboratorio,
        data.precio_venta,
        data.stock_minimo,
        image,
        id,
      ],
    );

    if (req.file?.filename && existing.imagen && existing.imagen !== req.file.filename) {
      removeUploadedFile(existing.imagen);
    }

    const medicamento = await queryOne('SELECT * FROM medicamentos WHERE id = ?', [id]);
    res.json({ message: 'Medicamento actualizado correctamente.', medicamento });
  } catch (error) {
    removeUploadedFile(req.file?.filename);
    throw error;
  }
}));

router.patch('/:id/toggle', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInteger(req.params.id, 'identificador', { min: 1 });
  const existing = await queryOne('SELECT id, activo FROM medicamentos WHERE id = ? LIMIT 1', [id]);
  if (!existing) throw new HttpError(404, 'Medicamento no encontrado.');

  await query('UPDATE medicamentos SET activo = 1 - activo WHERE id = ?', [id]);
  res.json({ message: 'Estado del medicamento actualizado.' });
}));

export default router;
