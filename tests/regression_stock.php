<?php
declare(strict_types=1);
require dirname(__DIR__).'/bootstrap.php';

use App\Core\Database;
use App\Services\VentaService;

$db=Database::connection();
$fixture=bin2hex(random_bytes(4));
$categoryId=(int)$db->query('SELECT id FROM categorias ORDER BY id LIMIT 1')->fetchColumn();
$db->prepare('INSERT INTO medicamentos(categoria_id,codigo,nombre,precio_venta,stock_minimo) VALUES(?,?,?,?,?)')->execute([$categoryId,'ZERO-'.$fixture,'Prueba agotamiento',3.00,1]);
$medId=(int)$db->lastInsertId();
$db->prepare("INSERT INTO lotes(medicamento_id,numero_lote,fecha_ingreso,fecha_vencimiento,cantidad_inicial,cantidad_disponible,usuario_registro_id) VALUES(?,?,CURDATE(),DATE_ADD(CURDATE(),INTERVAL 90 DAY),2,2,1)")->execute([$medId,'ZERO-L-'.$fixture]);

$passed=0; $failed=0; $saleId=0;
function checkStockTest(string $name,bool $condition):void {global $passed,$failed;echo ($condition?'[OK] ':'[FALLO] ').$name.PHP_EOL;$condition?$passed++:$failed++;}

try {
    $service=new VentaService();
    $saleId=$service->registrar([['medicamento_id'=>$medId,'cantidad'=>2]],1,['cliente_nombre'=>'PRUEBA STOCK CERO']);
    $stock=(int)$db->query("SELECT cantidad_disponible FROM lotes WHERE medicamento_id=$medId")->fetchColumn();
    checkStockTest('Vender exactamente las últimas dos unidades',$saleId>0);
    checkStockTest('Dejar el producto en stock cero',$stock===0);

    $salesBefore=(int)$db->query('SELECT COUNT(*) FROM ventas')->fetchColumn();
    $rejected=false;
    try {$service->registrar([['medicamento_id'=>$medId,'cantidad'=>1]],1,[]);} catch(Throwable $error) {$rejected=str_contains($error->getMessage(),'Stock insuficiente');}
    $salesAfter=(int)$db->query('SELECT COUNT(*) FROM ventas')->fetchColumn();
    $stockAfter=(int)$db->query("SELECT cantidad_disponible FROM lotes WHERE medicamento_id=$medId")->fetchColumn();
    checkStockTest('Bloquear una nueva compra cuando no queda stock',$rejected);
    checkStockTest('No crear una venta al rechazarla',$salesBefore===$salesAfter);
    checkStockTest('Mantener el stock en cero sin valores negativos',$stockAfter===0);
    checkStockTest('No tener cantidades negativas en ningún lote',(int)$db->query('SELECT COUNT(*) FROM lotes WHERE cantidad_disponible<0')->fetchColumn()===0);
} finally {
    if($saleId){
        $detail=$db->prepare('SELECT id FROM detalle_ventas WHERE venta_id=?');$detail->execute([$saleId]);$detailIds=$detail->fetchAll(PDO::FETCH_COLUMN);
        if($detailIds){$marks=implode(',',array_fill(0,count($detailIds),'?'));$db->prepare("DELETE FROM detalle_venta_lotes WHERE detalle_venta_id IN ($marks)")->execute($detailIds);}
        $db->prepare('DELETE FROM movimientos_inventario WHERE venta_id=?')->execute([$saleId]);
        $db->prepare('DELETE FROM detalle_ventas WHERE venta_id=?')->execute([$saleId]);
        $db->prepare('DELETE FROM ventas WHERE id=?')->execute([$saleId]);
    }
    $db->prepare('DELETE FROM lotes WHERE medicamento_id=?')->execute([$medId]);
    $db->prepare('DELETE FROM medicamentos WHERE id=?')->execute([$medId]);
}

echo "Resultado: $passed aprobadas, $failed fallidas.".PHP_EOL;
exit($failed?1:0);
