<?php
declare(strict_types=1);
namespace App\Core;

final class Auth
{
    public static function user(): ?array { return $_SESSION['user'] ?? null; }
    public static function id(): int { return (int)($_SESSION['user']['id'] ?? 0); }
    public static function check(): bool { return self::id() > 0; }
    public static function isAdmin(): bool { return ($_SESSION['user']['rol'] ?? '') === 'administrador'; }

    public static function attempt(string $usuario, string $password): bool
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT u.id,u.nombres,u.usuario,u.password_hash,r.nombre rol FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.usuario=? AND u.activo=1 LIMIT 1');
        $stmt->execute([$usuario]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) return false;
        if (!headers_sent()) session_regenerate_id(true);
        unset($user['password_hash']);
        $_SESSION['user'] = $user;
        $pdo->prepare('UPDATE usuarios SET ultimo_acceso=NOW() WHERE id=?')->execute([$user['id']]);
        return true;
    }

    public static function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time()-42000, $p['path'], $p['domain'] ?? '', (bool)$p['secure'], (bool)$p['httponly']);
        }
        session_destroy();
    }

    public static function requireLogin(): void
    {
        if (!self::check()) { redirect('index.php?page=login'); }
    }

    public static function requireAdmin(): void
    {
        self::requireLogin();
        if (!self::isAdmin()) { http_response_code(403); flash('danger','No tienes permiso para esta acción.'); redirect('index.php'); }
    }
}
