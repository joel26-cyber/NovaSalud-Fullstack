<?php
declare(strict_types=1);
namespace App\Core;

final class View
{
    public static function render(string $view, array $data=[]): void
    {
        extract($data, EXTR_SKIP);
        $viewFile = BASE_PATH . '/app/Views/' . $view . '.php';
        if (!is_file($viewFile)) throw new \RuntimeException('Vista no encontrada: ' . $view);
        require BASE_PATH . '/app/Views/layout.php';
    }
}
