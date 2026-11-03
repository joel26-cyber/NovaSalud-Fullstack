<div class="page-heading">
  <div><h1>Historial de ventas</h1><p>Consulta de comprobantes y lotes utilizados</p></div>
  <a class="btn btn-primary" href="<?=url('index.php?page=ventas')?>">Nueva venta</a>
</div>

<div class="panel mb-4">
  <form class="row g-2">
    <input type="hidden" name="page" value="historial">
    <div class="col-md-4"><input class="form-control" name="q" value="<?=e($q)?>" placeholder="Número o cliente"></div>
    <div class="col-md-3"><input type="date" class="form-control" name="desde" value="<?=e($desde)?>"></div>
    <div class="col-md-3"><input type="date" class="form-control" name="hasta" value="<?=e($hasta)?>"></div>
    <div class="col-md-2"><button class="btn btn-outline-primary w-100">Buscar</button></div>
  </form>
</div>

<div class="panel">
  <div class="table-responsive">
    <table class="table align-middle">
      <thead><tr><th>Número</th><th>Fecha</th><th>Usuario</th><th>Cliente</th><th>Productos</th><th>Método</th><th>Total</th><th></th></tr></thead>
      <tbody>
      <?php foreach($ventas as $venta): ?>
        <?php $receiptUrl = url('index.php?page=venta&id='.$venta['id']); ?>
        <tr>
          <td><strong><?=e($venta['numero'])?></strong></td>
          <td><?=date('d/m/Y H:i', strtotime($venta['creado_en']))?></td>
          <td><?=e($venta['usuario'])?></td>
          <td><?=e($venta['cliente_nombre'] ?: 'Público general')?></td>
          <td><?=$venta['items']?></td>
          <td><?=e(ucfirst($venta['metodo_pago']))?></td>
          <td class="fw-bold"><?=money($venta['total'])?></td>
          <td>
            <a class="btn btn-sm btn-light js-receipt-open" href="<?=$receiptUrl?>" data-receipt-url="<?=$receiptUrl.'&modal=1'?>" aria-label="Ver comprobante">
              <i class="bi bi-eye"></i>
            </a>
          </td>
        </tr>
      <?php endforeach ?>
      <?php if(!$ventas): ?><tr><td colspan="8" class="empty-state">No hay ventas para mostrar</td></tr><?php endif ?>
      </tbody>
    </table>
  </div>
</div>

<div class="modal fade" id="saleReceiptModal" tabindex="-1" aria-labelledby="saleReceiptModalTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered receipt-modal-dialog">
    <div class="modal-content receipt-modal-content">
      <div class="modal-header receipt-modal-header">
        <h2 class="modal-title" id="saleReceiptModalTitle"><i class="bi bi-receipt me-2"></i>Comprobante de venta</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body receipt-modal-body" id="saleReceiptContent">
        <div class="receipt-loading"><span class="spinner-border spinner-border-sm"></span> Cargando comprobante...</div>
      </div>
      <div class="modal-footer receipt-modal-footer">
        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cerrar</button>
        <a class="btn btn-primary" id="saleReceiptPrint" href="#" target="_blank"><i class="bi bi-printer me-1"></i> Abrir para imprimir</a>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('click', async (event) => {
  const trigger = event.target.closest('.js-receipt-open');
  if (!trigger) return;
  event.preventDefault();

  const modalElement = document.getElementById('saleReceiptModal');
  const content = document.getElementById('saleReceiptContent');
  const printLink = document.getElementById('saleReceiptPrint');
  content.innerHTML = '<div class="receipt-loading"><span class="spinner-border spinner-border-sm"></span> Cargando comprobante...</div>';
  printLink.href = trigger.href;
  bootstrap.Modal.getOrCreateInstance(modalElement).show();

  try {
    const response = await fetch(trigger.dataset.receiptUrl, {headers: {'X-Requested-With': 'XMLHttpRequest'}});
    if (!response.ok) throw new Error('No se pudo cargar el comprobante.');
    content.innerHTML = await response.text();
  } catch (error) {
    content.innerHTML = '<div class="alert alert-danger mb-0">No se pudo cargar el comprobante. Inténtalo nuevamente.</div>';
  }
});
</script>
