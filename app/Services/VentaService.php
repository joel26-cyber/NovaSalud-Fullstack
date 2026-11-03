<?php
declare(strict_types=1);
namespace App\Services;

use App\Core\Database;
use PDO;
use Throwable;

final class VentaService
{
    public function registrar(array $items, int $usuarioId, array $datos): int
    {
        if (!$items) throw new \InvalidArgumentException('El carrito está vacío.');
        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $itemsNormalizados = [];
            foreach ($items as $item) {
                $id = filter_var($item['medicamento_id'] ?? null, FILTER_VALIDATE_INT);
                $cantidad = filter_var($item['cantidad'] ?? null, FILTER_VALIDATE_INT);
                if (!$id || !$cantidad || $cantidad < 1) throw new \InvalidArgumentException('Hay productos o cantidades inválidas.');
                $itemsNormalizados[$id] = ($itemsNormalizados[$id] ?? 0) + $cantidad;
            }

            $productos = [];
            $total = 0.0;
            $qProducto = $pdo->prepare('SELECT id,nombre,precio_venta FROM medicamentos WHERE id=? AND activo=1 FOR UPDATE');
            foreach ($itemsNormalizados as $id => $cantidad) {
                $qProducto->execute([$id]);
                $p = $qProducto->fetch();
                if (!$p) throw new \RuntimeException('Uno de los medicamentos no está disponible.');
                $p['cantidad'] = $cantidad;
                $p['subtotal'] = round((float)$p['precio_venta'] * $cantidad, 2);
                $total += $p['subtotal'];
                $productos[] = $p;
            }

            $numero = 'V-' . date('Ymd-His') . '-' . strtoupper(bin2hex(random_bytes(2)));
            $stmtVenta = $pdo->prepare('INSERT INTO ventas(numero,usuario_id,cliente_nombre,cliente_documento,metodo_pago,total) VALUES(?,?,?,?,?,?)');
            $metodo = in_array($datos['metodo_pago'] ?? '', ['efectivo','yape','plin','tarjeta'], true) ? $datos['metodo_pago'] : 'efectivo';
            $stmtVenta->execute([$numero,$usuarioId,trim((string)($datos['cliente_nombre']??''))?:null,trim((string)($datos['cliente_documento']??''))?:null,$metodo,$total]);
            $ventaId = (int)$pdo->lastInsertId();

            $qLotes = $pdo->prepare("SELECT id,cantidad_disponible FROM lotes WHERE medicamento_id=? AND estado='habilitado' AND fecha_vencimiento>CURDATE() AND cantidad_disponible>0 ORDER BY fecha_vencimiento ASC,id ASC FOR UPDATE");
            $insDetalle = $pdo->prepare('INSERT INTO detalle_ventas(venta_id,medicamento_id,cantidad,precio_unitario,subtotal) VALUES(?,?,?,?,?)');
            $insUso = $pdo->prepare('INSERT INTO detalle_venta_lotes(detalle_venta_id,lote_id,cantidad) VALUES(?,?,?)');
            $updLote = $pdo->prepare('UPDATE lotes SET cantidad_disponible=? WHERE id=? AND cantidad_disponible=?');
            $insMov = $pdo->prepare("INSERT INTO movimientos_inventario(medicamento_id,lote_id,usuario_id,venta_id,tipo,cantidad,stock_anterior,stock_posterior,motivo) VALUES(?,?,?,?,'venta',?,?,?,?)");

            foreach ($productos as $p) {
                $qLotes->execute([$p['id']]);
                $lotes = $qLotes->fetchAll();
                $disponible = array_sum(array_column($lotes,'cantidad_disponible'));
                if ($disponible < $p['cantidad']) throw new \RuntimeException("Stock insuficiente para {$p['nombre']}. Disponible: {$disponible}.");

                $insDetalle->execute([$ventaId,$p['id'],$p['cantidad'],$p['precio_venta'],$p['subtotal']]);
                $detalleId = (int)$pdo->lastInsertId();
                $pendiente = (int)$p['cantidad'];
                foreach ($lotes as $lote) {
                    if ($pendiente === 0) break;
                    $anterior = (int)$lote['cantidad_disponible'];
                    $tomar = min($pendiente,$anterior);
                    $posterior = $anterior-$tomar;
                    $updLote->execute([$posterior,$lote['id'],$anterior]);
                    if ($updLote->rowCount() !== 1) throw new \RuntimeException('El stock cambió durante la venta. Inténtalo nuevamente.');
                    $insUso->execute([$detalleId,$lote['id'],$tomar]);
                    $insMov->execute([$p['id'],$lote['id'],$usuarioId,$ventaId,-$tomar,$anterior,$posterior,'Salida por venta '.$numero]);
                    $pendiente -= $tomar;
                }
            }
            $pdo->commit();
            return $ventaId;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }
}
