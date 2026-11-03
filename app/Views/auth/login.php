<main class="login-wrapper">
  <div class="login-ambient-orb orb-1"></div>
  <div class="login-ambient-orb orb-2"></div>
  
  <div class="card shadow-lg login-card mx-auto">
    <div class="card-body p-4 p-sm-5">
      <div class="text-center mb-4">
        <img src="<?=url('public/assets/img/logo-stacked.png')?>" alt="NOVA SALUD" class="login-brand-img">
        <div class="login-system-pill mt-3">
          <span class="online-indicator"></span>Plataforma Clínica & Ventas
        </div>
      </div>

      <?php if($error):?>
        <div class="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div><?=e($error)?></div>
        </div>
      <?php endif?>

      <form method="post" autocomplete="off">
        <?=csrf_field()?>
        
        <div class="mb-3">
          <label class="form-label">Usuario del sistema</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-person-badge"></i></span>
            <input class="form-control form-control-lg" name="usuario" placeholder="Ingresa tu usuario" autocomplete="username" required autofocus>
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label">Contraseña de acceso</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-shield-lock"></i></span>
            <input type="password" class="form-control form-control-lg" name="password" placeholder="••••••••" autocomplete="current-password" required>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-100 py-3 login-btn">
          <span>Ingresar al Sistema</span>
          <i class="bi bi-arrow-right"></i>
        </button>
      </form>
    </div>
    
    <div class="login-footer text-center pb-4 text-muted">
      <small>© <?=date('Y')?> NovaSalud · Control FEFO & Farmacia Digital</small>
    </div>
  </div>
</main>
