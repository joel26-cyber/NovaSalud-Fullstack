<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\{Auth,Database,View};

final class DashboardController
{
 public function index(): void {
  Auth::requireLogin(); $db=Database::connection();
  $dias=(int)($db->query("SELECT valor FROM configuraciones WHERE clave='dias_alerta_vencimiento'")->fetchColumn()?:30);
  $stats=[
   'medicamentos'=>(int)$db->query('SELECT COUNT(*) FROM medicamentos WHERE activo=1')->fetchColumn(),
   'stock'=>(int)$db->query("SELECT COALESCE(SUM(cantidad_disponible),0) FROM lotes WHERE estado='habilitado' AND fecha_vencimiento>CURDATE()")->fetchColumn(),
   'ventas'=>(int)$db->query("SELECT COUNT(*) FROM ventas WHERE estado='completada' AND DATE(creado_en)=CURDATE()")->fetchColumn(),
   'ingresos'=>(float)$db->query("SELECT COALESCE(SUM(total),0) FROM ventas WHERE estado='completada' AND DATE(creado_en)=CURDATE()")->fetchColumn(),
   'vencidos'=>(int)$db->query("SELECT COUNT(*) FROM lotes WHERE cantidad_disponible>0 AND fecha_vencimiento<=CURDATE()")->fetchColumn(),
  ];
  $q=$db->prepare("SELECT COUNT(*) FROM lotes WHERE cantidad_disponible>0 AND fecha_vencimiento>CURDATE() AND fecha_vencimiento<=DATE_ADD(CURDATE(),INTERVAL ? DAY)"); $q->execute([$dias]); $stats['proximos']=(int)$q->fetchColumn();
  $bajo=$db->query("SELECT m.id,m.codigo,m.nombre,m.stock_minimo,COALESCE(SUM(CASE WHEN l.estado='habilitado' AND l.fecha_vencimiento>CURDATE() THEN l.cantidad_disponible ELSE 0 END),0) stock FROM medicamentos m LEFT JOIN lotes l ON l.medicamento_id=m.id WHERE m.activo=1 GROUP BY m.id HAVING stock<=m.stock_minimo ORDER BY stock LIMIT 5")->fetchAll();
  $ultimas=$db->query("SELECT v.id,v.numero,v.total,v.creado_en,u.nombres FROM ventas v JOIN usuarios u ON u.id=v.usuario_id WHERE v.estado='completada' ORDER BY v.id DESC LIMIT 5")->fetchAll();

  // Gráfico 1: Ventas e ingresos de los últimos 7 días
  $ventasMap = [];
  for ($i = 6; $i >= 0; $i--) {
   $d = date('Y-m-d', strtotime("-$i days"));
   $ventasMap[$d] = ['label' => date('d/m', strtotime("-$i days")), 'ingresos' => 0.0, 'ventas' => 0];
  }
  $rowsV = $db->query("SELECT DATE(creado_en) f, COUNT(*) cant, COALESCE(SUM(total),0) tot FROM ventas WHERE estado='completada' AND creado_en >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(creado_en)")->fetchAll();
  foreach ($rowsV as $r) {
   if (isset($ventasMap[$r['f']])) {
    $ventasMap[$r['f']]['ingresos'] = (float)$r['tot'];
    $ventasMap[$r['f']]['ventas'] = (int)$r['cant'];
   }
  }
  $chartVentas = [
   'labels' => array_column($ventasMap, 'label'),
   'ingresos' => array_column($ventasMap, 'ingresos'),
   'ventas' => array_column($ventasMap, 'ventas'),
  ];

  // Gráfico 2: Stock por categoría
  $catRows = $db->query("SELECT c.nombre, COALESCE(SUM(l.cantidad_disponible),0) stock FROM categorias c JOIN medicamentos m ON m.categoria_id=c.id AND m.activo=1 LEFT JOIN lotes l ON l.medicamento_id=m.id AND l.estado='habilitado' AND l.fecha_vencimiento>CURDATE() GROUP BY c.id ORDER BY stock DESC LIMIT 5")->fetchAll();
  $chartCategorias = [
   'labels' => array_column($catRows, 'nombre'),
   'stock' => array_map('intval', array_column($catRows, 'stock')),
  ];

  View::render('dashboard/index', compact('stats','bajo','ultimas','dias','chartVentas','chartCategorias'));
 }
}
