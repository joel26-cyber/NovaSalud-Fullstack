<?php
declare(strict_types=1);
namespace App\Controllers;
use App\Core\{Auth,Csrf,View};

final class AuthController
{
 public function login(): void {
  if(Auth::check()) redirect('index.php');
  $error=null;
  if($_SERVER['REQUEST_METHOD']==='POST'){
   Csrf::enforce();
   if(Auth::attempt(trim($_POST['usuario']??''),(string)($_POST['password']??''))) redirect('index.php');
   $error='Usuario o contraseña incorrectos.';
  }
  View::render('auth/login',compact('error'));
 }
 public function logout(): void { if($_SERVER['REQUEST_METHOD']==='POST') Csrf::enforce(); Auth::logout(); redirect('index.php?page=login'); }
}
