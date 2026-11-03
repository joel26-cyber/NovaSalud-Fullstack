<?php
declare(strict_types=1);

use App\Core\Csrf;

function e(mixed $value): string { return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); }
function app_config(string $key): mixed { static $c; $c ??= require BASE_PATH.'/config/app.php'; return $c[$key] ?? null; }
function url(string $path=''): string { return rtrim((string)app_config('base_url'),'/') . '/' . ltrim($path,'/'); }
function redirect(string $path): never { header('Location: ' . (str_starts_with($path,'http') ? $path : url($path))); exit; }
function csrf_field(): string { return '<input type="hidden" name="_token" value="'.e(Csrf::token()).'">'; }
function flash(string $type, string $message): void { $_SESSION['flash'][] = ['type'=>$type,'message'=>$message]; }
function old(string $key, mixed $default=''): mixed { return $_SESSION['old'][$key] ?? $default; }
function money(mixed $amount): string { return app_config('currency').' '.number_format((float)$amount,2); }
function selected(mixed $a, mixed $b): string { return (string)$a === (string)$b ? 'selected' : ''; }
