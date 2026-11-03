<?php
declare(strict_types=1);
require dirname(__DIR__).'/bootstrap.php';

use App\Core\{Auth,Database};
use App\Services\VentaService;

$db=Database::connection(); $ok=0; $fail=0;
function test(string $name,bool $condition):void {global $ok,$fail;if($condition){$ok++;echo "[OK] $name\n";}else{$fail++;echo "[FALLO] $name\n";}}

test('Conectar con la base de datos',(bool)$db->query('SELECT 1')->fetchColumn());
test('Crear las diez tablas requeridas',(int)$db->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()")->fetchColumn()===10);
test('Verificar la contraseña del administrador',Auth::attempt('adminB',(string)getenv('NOVA_TEST_PASSWORD')));
test('Rechazar una contraseña incorrecta',!Auth::attempt('adminB','incorrecta'));
$sellerName='test_vendedor_'.bin2hex(random_bytes(3));
$db->prepare('INSERT INTO usuarios(rol_id,nombres,usuario,password_hash) VALUES(2,?,?,?)')->execute(['Vendedor temporal',$sellerName,password_hash('Temporal#12345',PASSWORD_DEFAULT)]);
test('Iniciar sesión con rol vendedor',Auth::attempt($sellerName,'Temporal#12345') && !Auth::isAdmin());
$db->prepare('DELETE FROM usuarios WHERE usuario=?')->execute([$sellerName]);

$expired=(int)$db->query("SELECT COALESCE(SUM(cantidad_disponible),0) FROM lotes WHERE fecha_vencimiento<=CURDATE()")->fetchColumn();
$sellableExpired=(int)$db->query("SELECT COALESCE(SUM(cantidad_disponible),0) FROM lotes WHERE fecha_vencimiento<=CURDATE() AND fecha_vencimiento>CURDATE()")->fetchColumn();
test('Detectar lotes vencidos',$expired>0);
test('Excluir lotes vencidos del stock vendible',$sellableExpired===0);
$blocked=(int)$db->query("SELECT COALESCE(SUM(cantidad_disponible),0) FROM lotes WHERE estado='bloqueado'")->fetchColumn();
test('Detectar stock bloqueado',$blocked>0);

$fixture=bin2hex(random_bytes(4));
$categoryId=(int)$db->query('SELECT id FROM categorias ORDER BY id LIMIT 1')->fetchColumn();
$db->prepare('INSERT INTO medicamentos(categoria_id,codigo,nombre,precio_venta,stock_minimo) VALUES(?,?,?,?,?)')->execute([$categoryId,'TEST-'.$fixture,'Producto temporal FEFO',5.50,5]);
$medId=(int)$db->lastInsertId();
$insertLot=$db->prepare('INSERT INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,usuario_registro_id) VALUES(?,?,CURDATE(),DATE_ADD(CURDATE(),INTERVAL ? DAY),?,?,1)');
$insertLot->execute([$medId,'T-A-'.$fixture,10,20,20]);
$insertLot->execute([$medId,'T-B-'.$fixture,100,50,50]);
$before=$db->query("SELECT numero_lote,cantidad_disponible FROM lotes WHERE medicamento_id=$medId ORDER BY fecha_vencimiento,id")->fetchAll();
$ventaId=(new VentaService())->registrar([['medicamento_id'=>$medId,'cantidad'=>25]],1,['cliente_nombre'=>'PRUEBA AUTOMATIZADA','metodo_pago'=>'efectivo']);
$after=$db->query("SELECT numero_lote,cantidad_disponible FROM lotes WHERE medicamento_id=$medId ORDER BY fecha_vencimiento,id")->fetchAll();
test('Registrar una venta real',$ventaId>0);
test('Aplicar FEFO al primer lote',(int)$after[0]['cantidad_disponible']===(int)$before[0]['cantidad_disponible']-20);
test('Completar la venta desde el segundo lote',(int)$after[1]['cantidad_disponible']===(int)$before[1]['cantidad_disponible']-5);
$alloc=$db->prepare('SELECT dvl.cantidad FROM detalle_venta_lotes dvl JOIN detalle_ventas d ON d.id=dvl.detalle_venta_id WHERE d.venta_id=? ORDER BY dvl.id');$alloc->execute([$ventaId]);
test('Registrar los dos lotes utilizados',array_map('intval',$alloc->fetchAll(PDO::FETCH_COLUMN))===[20,5]);
$moves=$db->prepare("SELECT COUNT(*) FROM movimientos_inventario WHERE venta_id=? AND tipo='venta'");$moves->execute([$ventaId]);
test('Registrar movimientos por cada lote',(int)$moves->fetchColumn()===2);

$stockBefore=(int)$db->query("SELECT SUM(cantidad_disponible) FROM lotes WHERE medicamento_id=$medId")->fetchColumn();
$salesBefore=(int)$db->query('SELECT COUNT(*) FROM ventas')->fetchColumn();$rejected=false;
try{(new VentaService())->registrar([['medicamento_id'=>$medId,'cantidad'=>9999]],1,['metodo_pago'=>'efectivo']);}catch(Throwable $e){$rejected=true;}
$stockAfter=(int)$db->query("SELECT SUM(cantidad_disponible) FROM lotes WHERE medicamento_id=$medId")->fetchColumn();
$salesAfter=(int)$db->query('SELECT COUNT(*) FROM ventas')->fetchColumn();
test('Rechazar stock insuficiente',$rejected);
test('Revertir por completo una venta fallida',$stockBefore===$stockAfter&&$salesBefore===$salesAfter);

$detailIds=$db->prepare('SELECT id FROM detalle_ventas WHERE venta_id=?');$detailIds->execute([$ventaId]);$detailIds=$detailIds->fetchAll(PDO::FETCH_COLUMN);
if($detailIds){$marks=implode(',',array_fill(0,count($detailIds),'?'));$db->prepare("DELETE FROM detalle_venta_lotes WHERE detalle_venta_id IN ($marks)")->execute($detailIds);}
$db->prepare('DELETE FROM movimientos_inventario WHERE medicamento_id=?')->execute([$medId]);
$db->prepare('DELETE FROM detalle_ventas WHERE venta_id=?')->execute([$ventaId]);
$db->prepare('DELETE FROM ventas WHERE id=?')->execute([$ventaId]);
$db->prepare('DELETE FROM lotes WHERE medicamento_id=?')->execute([$medId]);
$db->prepare('DELETE FROM medicamentos WHERE id=?')->execute([$medId]);
test('Limpiar los datos temporales de prueba',(int)$db->query("SELECT COUNT(*) FROM medicamentos WHERE codigo='TEST-$fixture'")->fetchColumn()===0);

echo "\nResultado: $ok aprobadas, $fail fallidas.\n";
exit($fail?1:0);
