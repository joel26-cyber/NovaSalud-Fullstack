import { isoToDisplayDateTime, methodLabel, money } from '../utils/format';

export default function ReceiptTicket({ venta, detalles }) {
  if (!venta) return null;

  return (
    <article className="receipt-ticket">
      <div className="receipt-brand">
        <img src="/assets/img/logo-horizontal.png" alt="Nova Salud" />
      </div>
      <div className="receipt-title">
        <strong>COMPROBANTE INTERNO</strong>
        <span>Sin valor tributario</span>
      </div>

      <div className="receipt-reference">
        <strong>{venta.numero}</strong>
        <span>{isoToDisplayDateTime(venta.creado_en)}</span>
      </div>

      <div className="receipt-info">
        <div>
          <span>CLIENTE</span>
          <strong>{venta.cliente_nombre || 'Público general'}</strong>
        </div>
        {venta.cliente_documento && (
          <div>
            <span>DOCUMENTO</span>
            <strong>{venta.cliente_documento}</strong>
          </div>
        )}
        <div>
          <span>ATENDIDO POR</span>
          <strong>{venta.usuario}</strong>
        </div>
        <div>
          <span>MÉTODO</span>
          <strong>{methodLabel(venta.metodo_pago)}</strong>
        </div>
      </div>

      <div className="receipt-items-head">
        <span>PRODUCTO</span>
        <span>IMPORTE</span>
      </div>
      <div className="receipt-items">
        {detalles.map((detalle) => (
          <div className="receipt-item" key={detalle.id}>
            <div className="receipt-item-name">
              <strong>{detalle.nombre}</strong>
              <small>{detalle.codigo} · Lote: {detalle.lotes}</small>
            </div>
            <div className="receipt-item-values">
              <span>{detalle.cantidad} × {money(detalle.precio_unitario)}</span>
              <strong>{money(detalle.subtotal)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="receipt-ticket-total">
        <span>TOTAL</span>
        <strong>{money(venta.total)}</strong>
      </div>
      <div className="receipt-thanks">Gracias por su compra</div>
    </article>
  );
}
