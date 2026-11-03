import { withTransaction } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { saleNumber } from '../utils/dates.js';

const METODOS_PAGO = new Set(['efectivo', 'yape', 'plin', 'tarjeta']);

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(422, 'El carrito está vacío.');
  }

  const normalized = new Map();
  for (const item of items) {
    const medicamentoId = Number(item?.medicamento_id);
    const cantidad = Number(item?.cantidad);
    if (!Number.isInteger(medicamentoId) || medicamentoId < 1
      || !Number.isInteger(cantidad) || cantidad < 1) {
      throw new HttpError(422, 'Hay productos o cantidades inválidas.');
    }
    normalized.set(medicamentoId, (normalized.get(medicamentoId) || 0) + cantidad);
  }
  return normalized;
}

export async function registrarVenta(items, usuarioId, datos = {}) {
  const normalized = normalizeItems(items);

  return withTransaction(async (connection) => {
    const productos = [];
    let total = 0;

    for (const [medicamentoId, cantidad] of normalized) {
      const [rows] = await connection.query(
        'SELECT id, nombre, precio_venta FROM medicamentos WHERE id = ? AND activo = 1 FOR UPDATE',
        [medicamentoId],
      );
      const producto = rows[0];
      if (!producto) {
        throw new HttpError(422, 'Uno de los medicamentos no está disponible.');
      }

      const precio = Number(producto.precio_venta);
      const subtotal = Math.round(precio * cantidad * 100) / 100;
      total = Math.round((total + subtotal) * 100) / 100;
      productos.push({ ...producto, cantidad, precio_venta: precio, subtotal });
    }

    const numero = saleNumber();
    const metodo = METODOS_PAGO.has(datos?.metodo_pago) ? datos.metodo_pago : 'efectivo';
    const clienteNombre = String(datos?.cliente_nombre ?? '').trim().slice(0, 120) || null;
    const clienteDocumento = String(datos?.cliente_documento ?? '').trim().slice(0, 20) || null;

    const [saleResult] = await connection.query(
      `INSERT INTO ventas
        (numero, usuario_id, cliente_nombre, cliente_documento, metodo_pago, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [numero, usuarioId, clienteNombre, clienteDocumento, metodo, total],
    );
    const ventaId = saleResult.insertId;

    for (const producto of productos) {
      const [lotes] = await connection.query(
        `SELECT id, cantidad_disponible
         FROM lotes
         WHERE medicamento_id = ? AND estado = 'habilitado'
           AND fecha_vencimiento > CURDATE() AND cantidad_disponible > 0
         ORDER BY fecha_vencimiento ASC, id ASC
         FOR UPDATE`,
        [producto.id],
      );

      const disponible = lotes.reduce((sum, lote) => sum + Number(lote.cantidad_disponible), 0);
      if (disponible < producto.cantidad) {
        throw new HttpError(409, `Stock insuficiente para ${producto.nombre}. Disponible: ${disponible}.`);
      }

      const [detailResult] = await connection.query(
        `INSERT INTO detalle_ventas
          (venta_id, medicamento_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [ventaId, producto.id, producto.cantidad, producto.precio_venta, producto.subtotal],
      );
      const detalleId = detailResult.insertId;

      let pendiente = producto.cantidad;
      for (const lote of lotes) {
        if (pendiente <= 0) break;

        const anterior = Number(lote.cantidad_disponible);
        const tomar = Math.min(pendiente, anterior);
        const posterior = anterior - tomar;

        const [updateResult] = await connection.query(
          'UPDATE lotes SET cantidad_disponible = ? WHERE id = ? AND cantidad_disponible = ?',
          [posterior, lote.id, anterior],
        );
        if (updateResult.affectedRows !== 1) {
          throw new HttpError(409, 'El stock cambió durante la venta. Inténtalo nuevamente.');
        }

        await connection.query(
          'INSERT INTO detalle_venta_lotes (detalle_venta_id, lote_id, cantidad) VALUES (?, ?, ?)',
          [detalleId, lote.id, tomar],
        );
        await connection.query(
          `INSERT INTO movimientos_inventario
            (medicamento_id, lote_id, usuario_id, venta_id, tipo, cantidad,
             stock_anterior, stock_posterior, motivo)
           VALUES (?, ?, ?, ?, 'venta', ?, ?, ?, ?)`,
          [
            producto.id,
            lote.id,
            usuarioId,
            ventaId,
            -tomar,
            anterior,
            posterior,
            `Salida por venta ${numero}`,
          ],
        );

        pendiente -= tomar;
      }
    }

    return { id: ventaId, numero, total };
  });
}
