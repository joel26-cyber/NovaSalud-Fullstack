<?php
declare(strict_types=1);
namespace App\Core;

final class Csrf
{
    public static function token(): string
    {
        if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
        return $_SESSION['csrf'];
    }
    public static function validate(?string $token): bool
    {
        return is_string($token) && hash_equals($_SESSION['csrf'] ?? '', $token);
    }
    public static function enforce(): void
    {
        if (!self::validate($_POST['_token'] ?? null)) {
            http_response_code(419);
            exit('Solicitud expirada o inválida. Regresa y vuelve a intentarlo.');
        }
    }
}
