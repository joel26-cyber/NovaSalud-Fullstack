<article class="receipt-ticket">
  <div class="receipt-brand">
    <img src="<?=url('public/assets/img/logo-horizontal.png')?>" alt="Nova Salud">
  </div>
  <div class="receipt-title">
    <strong>COMPROBANTE INTERNO</strong>
    <span>Sin valor tributario</span>
  </div>

  <div class="receipt-reference">
    <strong><?=e($venta['numero'])?></strong>
    <span><?=date('d/m/Y H:i', strtotime($venta['creado_en']))?></span>
  </div>

  <div class="receipt-info">
    <div><span>CLIENTE</span><strong><?=e($venta['cliente_nombre'] ?: 'Público general')?></strong></div>
    <?php if(!empty($venta['cliente_documento'])): ?><div><span>DOCUMENTO</span><strong><?=e($venta['cliente_documento'])?></strong></div><?php endif ?>
    <div><span>ATENDIDO POR</span><strong><?=e($venta['usuario'])?></strong></div>
    <div><span>MÉTODO</span><strong><?=e(ucfirst($venta['metodo_pago']))?></strong></div>
  </div>

  <div class="receipt-items-head"><span>PRODUCTO</span><span>IMPORTE</span></div>
  <div class="receipt-items">
    <?php foreach($detalles as $detalle): ?>
      <div class="receipt-item">
        <div class="receipt-item-name">
          <strong><?=e($detalle['nombre'])?></strong>
          <small><?=e($detalle['codigo'])?> · Lote: <?=e($detalle['lotes'])?></small>
        </div>
        <div class="receipt-item-values">
          <span><?=$detalle['cantidad']?> × <?=money($detalle['precio_unitario'])?></span>
          <strong><?=money($detalle['subtotal'])?></strong>
        </div>
      </div>
    <?php endforeach ?>
  </div>

  <div class="receipt-ticket-total"><span>TOTAL</span><strong><?=money($venta['total'])?></strong></div>
  <div class="receipt-thanks">Gracias por su compra</div>
</article>
