import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import ReceiptTicket from './ReceiptTicket';

export default function ReceiptModal({ saleId, onClose }) {
  const [venta, setVenta] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!saleId) return undefined;
    let active = true;
    setLoading(true);
    setError('');
    setVenta(null);
    setDetalles([]);

    api.get(`/ventas/${saleId}`)
      .then(({ data }) => {
        if (!active) return;
        setVenta(data.venta);
        setDetalles(data.detalles || []);
      })
      .catch((requestError) => {
        if (active) setError(apiErrorMessage(requestError, 'No se pudo cargar el comprobante.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [saleId]);

  useEffect(() => {
    if (!saleId) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [saleId, onClose]);

  if (!saleId) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saleReceiptModalTitle"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="modal-dialog modal-dialog-centered receipt-modal-dialog">
          <div className="modal-content receipt-modal-content">
            <div className="modal-header receipt-modal-header">
              <h2 className="modal-title" id="saleReceiptModalTitle">
                <i className="bi bi-receipt me-2" />Comprobante de venta
              </h2>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar" />
            </div>
            <div className="modal-body receipt-modal-body">
              {loading && (
                <div className="receipt-loading">
                  <span className="spinner-border spinner-border-sm" /> Cargando comprobante...
                </div>
              )}
              {!loading && error && <div className="alert alert-danger mb-0">{error}</div>}
              {!loading && !error && <ReceiptTicket venta={venta} detalles={detalles} />}
            </div>
            <div className="modal-footer receipt-modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose}>Cerrar</button>
              <Link className="btn btn-primary" to={`/ventas/${saleId}`} target="_blank" rel="noreferrer">
                <i className="bi bi-printer me-1" /> Abrir para imprimir
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
