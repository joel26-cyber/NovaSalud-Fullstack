<div class="page-heading">
  <div>
    <h1>Reportes</h1>
    <p>Indicadores obtenidos directamente de la base de datos</p>
  </div>
  <div class="d-flex flex-wrap gap-2 justify-content-end">
    <a class="btn btn-outline-success" href="<?=url('index.php?page=reporte-csv&tipo=ventas&desde='.$desde.'&hasta='.$hasta)?>">
      <i class="bi bi-filetype-csv"></i> Ventas CSV
    </a>
    <a class="btn btn-outline-danger" href="<?=url('index.php?page=reporte-pdf&tipo=ventas&desde='.$desde.'&hasta='.$hasta)?>">
      <i class="bi bi-filetype-pdf"></i> Ventas PDF
    </a>
    <a class="btn btn-outline-success" href="<?=url('index.php?page=reporte-csv&tipo=stock')?>">
      <i class="bi bi-filetype-csv"></i> Stock CSV
    </a>
    <a class="btn btn-outline-danger" href="<?=url('index.php?page=reporte-pdf&tipo=stock')?>">
      <i class="bi bi-filetype-pdf"></i> Stock PDF
    </a>
  </div>
</div>

<div class="panel mb-4">
  <form class="row g-2">
    <input type="hidden" name="page" value="reportes">
    <div class="col-md-5">
      <label class="form-label">Desde</label>
      <input type="date" class="form-control" name="desde" value="<?=e($desde)?>">
    </div>
    <div class="col-md-5">
      <label class="form-label">Hasta</label>
      <input type="date" class="form-control" name="hasta" value="<?=e($hasta)?>">
    </div>
    <div class="col-md-2 d-flex align-items-end">
      <button class="btn btn-primary w-100">Consultar</button>
    </div>
  </form>
</div>

<div class="row g-4">
  <div class="col-lg-6">
    <div class="panel">
      <h2 class="h5 mb-3">Ventas diarias</h2>
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th>Fecha</th><th>Ventas</th><th>Ingresos</th></tr></thead>
          <tbody>
          <?php foreach($diarias as $r): ?>
            <tr>
              <td><?=date('d/m/Y', strtotime($r['fecha']))?></td>
              <td><?=$r['ventas']?></td>
              <td class="fw-bold"><?=money($r['total'])?></td>
            </tr>
          <?php endforeach ?>
          <?php if(!$diarias): ?><tr><td colspan="3" class="empty-state">Sin ventas en este periodo</td></tr><?php endif ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="col-lg-6">
    <div class="panel">
      <h2 class="h5 mb-3">Productos más vendidos</h2>
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th>Producto</th><th>Unidades</th><th>Importe</th></tr></thead>
          <tbody>
          <?php foreach($productos as $r): ?>
            <tr>
              <td><strong><?=e($r['nombre'])?></strong><small class="d-block"><?=e($r['codigo'])?></small></td>
              <td><?=$r['cantidad']?></td>
              <td><?=money($r['importe'])?></td>
            </tr>
          <?php endforeach ?>
          <?php if(!$productos): ?><tr><td colspan="3" class="empty-state">Sin datos</td></tr><?php endif ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
