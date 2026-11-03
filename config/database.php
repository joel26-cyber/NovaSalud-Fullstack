<?php
declare(strict_types=1);

return [
    'host' => getenv('NOVA_DB_HOST') ?: '127.0.0.1',
    'port' => getenv('NOVA_DB_PORT') ?: '3306',
    'database' => getenv('NOVA_DB_NAME') ?: 'bd_botica',
    'username' => getenv('NOVA_DB_USER') ?: 'root',
    'password' => getenv('NOVA_DB_PASS') ?: '',
    'charset' => 'utf8mb4',
];
