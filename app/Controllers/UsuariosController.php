<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\{Auth,Csrf,Database,View};

final class UsuariosController
{
 public function index():void {Auth::requireAdmin();$db=Database::connection();$usuarios=$db->query('SELECT u.*,r.nombre rol FROM usuarios u JOIN roles r ON r.id=u.rol_id ORDER BY u.nombres')->fetchAll();$dias=(int)($db->query("SELECT valor FROM configuraciones WHERE clave='dias_alerta_vencimiento'")->fetchColumn()?:30);View::render('configuracion/index',compact('usuarios','dias'));}
 public function save():void {Auth::requireAdmin();Csrf::enforce();$nombre=trim($_POST['nombres']??'');$usuario=trim($_POST['usuario']??'');$clave=(string)($_POST['clave']??'');$rol=(int)($_POST['rol_id']??0);if(mb_strlen($nombre)<3||!preg_match('/^[A-Za-z0-9_.-]{4,30}$/',$usuario)||strlen($clave)<10||!in_array($rol,[1,2],true)){flash('danger','Datos de usuario inválidos.');redirect('index.php?page=usuarios');}try{Database::connection()->prepare('INSERT INTO usuarios(rol_id,nombres,usuario,password_hash) VALUES(?,?,?,?)')->execute([$rol,$nombre,$usuario,password_hash($clave,PASSWORD_DEFAULT)]);flash('success','Usuario creado.');}catch(\Throwable $e){flash('danger','No se pudo crear. El usuario puede estar repetido.');}redirect('index.php?page=usuarios');}
 public function configSave():void {Auth::requireAdmin();Csrf::enforce();$dias=filter_var($_POST['dias']??null,FILTER_VALIDATE_INT);if($dias===false||$dias<1||$dias>365){flash('danger','Los días deben estar entre 1 y 365.');}else{Database::connection()->prepare("INSERT INTO configuraciones(clave,valor,descripcion) VALUES('dias_alerta_vencimiento',?,'Días de anticipación para alertar vencimientos') ON DUPLICATE KEY UPDATE valor=VALUES(valor)")->execute([$dias]);flash('success','Configuración actualizada.');}redirect('index.php?page=usuarios');}
}
