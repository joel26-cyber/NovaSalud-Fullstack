<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\{Auth, Database, View};
use App\Services\PdfReport;

final class ReportesController
{
    public function index(): void
    {
        Auth::requireAdmin();
        [$desde, $hasta] = $this->periodo();
        $db = Database::connection();

        $query = $db->prepare("SELECT DATE(creado_en) fecha, COUNT(*) ventas, SUM(total) total
            FROM ventas
            WHERE estado='completada' AND DATE(creado_en) BETWEEN ? AND ?
            GROUP BY DATE(creado_en) ORDER BY fecha DESC");
        $query->execute([$desde, $hasta]);
        $diarias = $query->fetchAll();

        $query = $db->prepare("SELECT m.codigo, m.nombre, SUM(d.cantidad) cantidad, SUM(d.subtotal) importe
            FROM detalle_ventas d
            JOIN ventas v ON v.id=d.venta_id
            JOIN medicamentos m ON m.id=d.medicamento_id
            WHERE v.estado='completada' AND DATE(v.creado_en) BETWEEN ? AND ?
            GROUP BY m.id ORDER BY cantidad DESC LIMIT 20");
        $query->execute([$desde, $hasta]);
        $productos = $query->fetchAll();

        View::render('reportes/index', compact('diarias', 'productos', 'desde', 'hasta'));
    }

    public function csv(): void
    {
        Auth::requireAdmin();
        [$desde, $hasta] = $this->periodo();
        $tipo = $this->tipo();
        $rows = $tipo === 'stock' ? $this->stockRows() : $this->ventasRows($desde, $hasta);

        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="reporte_'.$tipo.'_'.date('Ymd_His').'.csv"');
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");

        if ($tipo === 'stock') {
            fputcsv($out, ['Código', 'Medicamento', 'Stock mínimo', 'Stock disponible'], ';');
        } else {
            fputcsv($out, ['Venta', 'Fecha', 'Usuario', 'Cliente', 'Método', 'Total'], ';');
        }
        foreach ($rows as $row) fputcsv($out, $row, ';');
        fclose($out);
        exit;
    }

    public function pdf(): void
    {
        Auth::requireAdmin();
        [$desde, $hasta] = $this->periodo();
        $tipo = $this->tipo();

        if ($tipo === 'stock') {
            $source = $this->stockRows();
            $rows = array_map(fn(array $row): array => [
                $row['codigo'],
                $row['nombre'],
                (string) $row['stock_minimo'],
                (string) $row['stock'],
            ], $source);
            $available = array_sum(array_map(fn(array $row): int => (int) $row['stock'], $source));
            $report = new PdfReport(
                'Reporte de stock',
                'Inventario disponible al '.date('d/m/Y H:i'),
                ['Código', 'Medicamento', 'Stock mínimo', 'Disponible'],
                [82, 235, 96, 98],
                ['left', 'left', 'center', 'center'],
                BASE_PATH.'/public/assets/img/logo-report.jpg'
            );
            $summary = 'Productos activos: '.count($rows).'  |  Unidades disponibles: '.$available;
        } else {
            $source = $this->ventasRows($desde, $hasta);
            $rows = array_map(fn(array $row): array => [
                $row['numero'],
                date('d/m/Y H:i', strtotime($row['creado_en'])),
                $row['nombres'],
                $row['cliente_nombre'] ?: 'Público general',
                ucfirst($row['metodo_pago']),
                'S/ '.number_format((float) $row['total'], 2),
            ], $source);
            $total = array_sum(array_map(fn(array $row): float => (float) $row['total'], $source));
            $report = new PdfReport(
                'Reporte de ventas',
                'Periodo: '.date('d/m/Y', strtotime($desde)).' al '.date('d/m/Y', strtotime($hasta)),
                ['Venta', 'Fecha', 'Usuario', 'Cliente', 'Método', 'Total'],
                [105, 80, 94, 88, 69, 75],
                ['left', 'left', 'left', 'left', 'left', 'right'],
                BASE_PATH.'/public/assets/img/logo-report.jpg'
            );
            $summary = 'Ventas completadas: '.count($rows).'  |  Ingresos: S/ '.number_format($total, 2);
        }

        $content = $report->render($rows, $summary);
        $filename = 'reporte_'.$tipo.'_'.date('Ymd_His').'.pdf';
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="'.$filename.'"');
        header('Content-Length: '.strlen($content));
        header('Cache-Control: private, max-age=0, must-revalidate');
        echo $content;
        exit;
    }

    private function ventasRows(string $desde, string $hasta): array
    {
        $query = Database::connection()->prepare("SELECT v.numero, v.creado_en, u.nombres,
                v.cliente_nombre, v.metodo_pago, v.total
            FROM ventas v
            JOIN usuarios u ON u.id=v.usuario_id
            WHERE v.estado='completada' AND DATE(v.creado_en) BETWEEN ? AND ?
            ORDER BY v.creado_en");
        $query->execute([$desde, $hasta]);
        return $query->fetchAll();
    }

    private function stockRows(): array
    {
        return Database::connection()->query("SELECT m.codigo, m.nombre, m.stock_minimo,
                COALESCE(SUM(CASE WHEN l.estado='habilitado' AND l.fecha_vencimiento>=CURDATE()
                    THEN l.cantidad_disponible ELSE 0 END),0) stock
            FROM medicamentos m
            LEFT JOIN lotes l ON l.medicamento_id=m.id
            WHERE m.activo=1
            GROUP BY m.id
            ORDER BY m.nombre")->fetchAll();
    }

    private function periodo(): array
    {
        $desde = $_GET['desde'] ?? date('Y-m-01');
        $hasta = $_GET['hasta'] ?? date('Y-m-d');
        if (!$this->validDate($desde)) $desde = date('Y-m-01');
        if (!$this->validDate($hasta)) $hasta = date('Y-m-d');
        if ($desde > $hasta) [$desde, $hasta] = [$hasta, $desde];
        return [$desde, $hasta];
    }

    private function tipo(): string
    {
        return ($_GET['tipo'] ?? 'ventas') === 'stock' ? 'stock' : 'ventas';
    }

    private function validDate(string $date): bool
    {
        $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        return $parsed !== false && $parsed->format('Y-m-d') === $date;
    }
}
