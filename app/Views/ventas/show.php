<div class="page-heading no-print">
  <div>
    <h1>Comprobante interno</h1>
    <p>Detalle de la venta y trazabilidad FEFO</p>
  </div>
  <div>
    <button class="btn btn-outline-primary" onclick="window.print()"><i class="bi bi-printer"></i> Imprimir</button>
    <a class="btn btn-light" href="<?=url('index.php?page=historial')?>">Volver</a>
  </div>
</div>

<div class="receipt-page-wrap">
  <?php require BASE_PATH.'/app/Views/ventas/receipt.php'; ?>
</div>
