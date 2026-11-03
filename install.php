<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

use App\Core\Csrf;
use App\Core\Database;

$error = null; $success = null;
try {
    $server = Database::serverConnection();
    $cfg = require BASE_PATH.'/config/database.php';
    $dbName = preg_replace('/[^a-zA-Z0-9_]/','',$cfg['database']);
    $server->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $server->exec("USE `$dbName`");
    $exists = $server->query("SHOW TABLES LIKE 'usuarios'")->fetchColumn();
    $hasAdmin = $exists ? (int)$server->query("SELECT COUNT(*) FROM usuarios WHERE rol_id=1")->fetchColumn() > 0 : false;
    if ($hasAdmin) $success = 'El sistema ya está instalado. El instalador quedó bloqueado.';
} catch (Throwable $e) { $error = 'No se pudo conectar a MySQL: '.$e->getMessage(); }

if ($_SERVER['REQUEST_METHOD']==='POST' && !$success) {
    Csrf::enforce();
    $nombres=trim($_POST['nombres']??''); $usuario=trim($_POST['usuario']??''); $clave=(string)($_POST['clave']??'');
    if (mb_strlen($nombres)<3 || !preg_match('/^[A-Za-z0-9_.-]{4,30}$/',$usuario) || strlen($clave)<10) {
        $error='Completa los datos. El usuario requiere 4 caracteres y la contraseña al menos 10.';
    } else {
        try {
            $sql=file_get_contents(BASE_PATH.'/database/BD_Botica.sql');
            $server->exec($sql);
            $stmt=$server->prepare('INSERT INTO usuarios(rol_id,nombres,usuario,password_hash) VALUES(1,?,?,?)');
            $stmt->execute([$nombres,$usuario,password_hash($clave,PASSWORD_DEFAULT)]);
            $success='Instalación completada. Ya puedes iniciar sesión.';
        } catch(Throwable $e) { $error='No fue posible instalar: '.$e->getMessage(); }
    }
}
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Instalar Nova Salud</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"><link rel="stylesheet" href="<?=url('public/assets/css/app.css')?>"></head>
<body class="login-page"><main class="container py-5"><div class="card shadow login-card mx-auto"><div class="card-body p-4 p-md-5"><div class="brand-mark mx-auto mb-3">NS</div><h1 class="h3 text-center">Instalar Nova Salud</h1><p class="text-muted text-center">Crear la primera cuenta administradora</p>
<?php if($error):?><div class="alert alert-danger"><?=e($error)?></div><?php endif?>
<?php if($success):?><div class="alert alert-success"><?=e($success)?></div><a class="btn btn-primary w-100" href="<?=url('index.php?page=login')?>">Ir al inicio de sesión</a>
<?php else:?><form method="post"><?=csrf_field()?><label class="form-label">Nombre completo</label><input class="form-control mb-3" name="nombres" required maxlength="100"><label class="form-label">Usuario</label><input class="form-control mb-3" name="usuario" required pattern="[A-Za-z0-9_.-]{4,30}"><label class="form-label">Contraseña segura</label><input type="password" class="form-control mb-4" name="clave" required minlength="10"><button class="btn btn-primary w-100">Instalar sistema</button></form><?php endif?></div></div></main></body></html>
