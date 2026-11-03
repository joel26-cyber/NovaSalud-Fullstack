<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\MedicamentosController;
use App\Controllers\LotesController;
use App\Controllers\InventarioController;
use App\Controllers\VentasController;
use App\Controllers\ReportesController;
use App\Controllers\UsuariosController;

$page = $_GET['page'] ?? 'dashboard';
$routes = [
 'login'=>[AuthController::class,'login'], 'logout'=>[AuthController::class,'logout'],
 'dashboard'=>[DashboardController::class,'index'],
 'medicamentos'=>[MedicamentosController::class,'index'], 'medicamento-form'=>[MedicamentosController::class,'form'], 'medicamento-save'=>[MedicamentosController::class,'save'], 'medicamento-toggle'=>[MedicamentosController::class,'toggle'],
 'lotes'=>[LotesController::class,'index'], 'lote-form'=>[LotesController::class,'form'], 'lote-save'=>[LotesController::class,'save'], 'lote-toggle'=>[LotesController::class,'toggle'], 'vencimientos'=>[LotesController::class,'vencimientos'],
 'inventario'=>[InventarioController::class,'index'], 'ajuste'=>[InventarioController::class,'ajuste'],
 'ventas'=>[VentasController::class,'pos'], 'stock-check'=>[VentasController::class,'stockCheck'], 'venta-save'=>[VentasController::class,'save'], 'historial'=>[VentasController::class,'historial'], 'venta'=>[VentasController::class,'show'],
 'reportes'=>[ReportesController::class,'index'], 'reporte-csv'=>[ReportesController::class,'csv'], 'reporte-pdf'=>[ReportesController::class,'pdf'],
 'usuarios'=>[UsuariosController::class,'index'], 'usuario-save'=>[UsuariosController::class,'save'], 'config-save'=>[UsuariosController::class,'configSave'],
];
if (!isset($routes[$page])) { http_response_code(404); exit('Página no encontrada'); }
[$class,$method]=$routes[$page];
(new $class())->$method();
