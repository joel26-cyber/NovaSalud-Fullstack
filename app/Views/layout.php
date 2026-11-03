<?php use App\Core\Auth; $isLogin=$view==='auth/login'; ?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title><?=e($title??app_config('name'))?></title><link rel="icon" type="image/png" href="<?=url('public/assets/img/logo-stacked.png')?>"><link href="<?=url('public/assets/css/bootstrap.min.css')?>" rel="stylesheet"><link href="<?=url('public/assets/css/bootstrap-icons.css')?>" rel="stylesheet"><link href="<?=url('public/assets/css/app.css?v=9')?>" rel="stylesheet"><link href="<?=url('public/assets/css/stock-control.css?v=6')?>" rel="stylesheet"><link href="<?=url('public/assets/css/nova-modal.css?v=1')?>" rel="stylesheet"></head>
<body class="<?=$isLogin?'login-page':''?>">
<?php if($isLogin): require $viewFile; else: ?>
<div class="app-shell">
 <aside class="sidebar" id="sidebar"><div class="sidebar-brand"><a href="<?=url('index.php?page=dashboard')?>" class="sidebar-brand-link"><img src="<?=url('public/assets/img/logo-horizontal.png')?>" alt="NOVA SALUD" class="sidebar-logo-img"></a></div><nav class="nav flex-column sidebar-nav">
 <?php $page=$_GET['page']??'dashboard'; $nav=[['dashboard','bi-grid','Dashboard'],['ventas','bi-cart3','Punto de venta'],['historial','bi-receipt','Historial de ventas'],['medicamentos','bi-capsule','Medicamentos'],['lotes','bi-box-seam','Lotes'],['vencimientos','bi-calendar2-check','Vencimientos']];if(Auth::isAdmin()){array_push($nav,['inventario','bi-arrow-left-right','Inventario'],['reportes','bi-bar-chart','Reportes'],['usuarios','bi-people','Usuarios y ajustes']);} foreach($nav as$n):?><a class="nav-link <?=$page===$n[0]?'active':''?>" href="<?=url('index.php?page='.$n[0])?>"><i class="bi <?=$n[1]?>"></i><span><?=$n[2]?></span></a><?php endforeach?></nav></aside>
 <div class="main-wrap"><header class="topbar"><button class="btn btn-light d-lg-none" id="menuToggle"><i class="bi bi-list"></i></button><div class="ms-auto d-flex align-items-center gap-3"><div class="text-end"><strong><?=e(Auth::user()['nombres'])?></strong><small class="d-block text-muted"><?=e(ucfirst(Auth::user()['rol']))?></small></div><form method="post" action="<?=url('index.php?page=logout')?>"><?=csrf_field()?><button class="btn btn-outline-secondary btn-sm" title="Cerrar sesión"><i class="bi bi-box-arrow-right"></i></button></form></div></header>
 <main class="content container-fluid">
 <?php foreach($_SESSION['flash']??[] as$f):?><div class="alert alert-<?=e($f['type'])?> alert-dismissible fade show"><span><?=e($f['message'])?></span><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div><?php endforeach; unset($_SESSION['flash']); ?>
 <?php require $viewFile; ?>
 </main></div></div>
<?php endif?>
<div class="modal fade nova-confirm-modal" id="novaConfirmModal" tabindex="-1" aria-labelledby="novaConfirmTitle" aria-hidden="true">
 <div class="modal-dialog modal-dialog-centered"><div class="modal-content">
  <button type="button" class="btn-close nova-modal-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
  <div class="nova-modal-body">
   <div class="nova-modal-icon" aria-hidden="true"><i class="bi bi-exclamation-lg"></i></div>
   <h2 class="nova-modal-title" id="novaConfirmTitle">Confirmar acción</h2>
   <p class="nova-modal-message" id="novaConfirmMessage"></p>
   <div class="nova-modal-actions">
    <button type="button" class="btn nova-modal-cancel" data-bs-dismiss="modal">Cancelar</button>
    <button type="button" class="btn nova-modal-confirm" id="novaConfirmButton">Confirmar</button>
   </div>
  </div>
 </div></div>
</div>
<script src="<?=url('public/assets/js/chart.min.js')?>"></script><script src="<?=url('public/assets/js/bootstrap.bundle.min.js')?>"></script><script src="<?=url('public/assets/js/app.js?v=7')?>"></script></body></html>
