import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import ReceiptModal from '../components/ReceiptModal';
import { isoToDisplayDateTime, methodLabel, money, number } from '../utils/format';

export default function Historial() {
  const { notify } = useToast();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', desde: '', hasta: '' });
  const [applied, setApplied] = useState(filters);
  const [receiptId, setReceiptId] = useState(null);

  const load = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const { data } = await api.get('/ventas', {
        params: {
          q: currentFilters.q || undefined,
          desde: currentFilters.desde || undefined,
          hasta: currentFilters.hasta || undefined,
        },
      });
      setVentas(data.ventas || []);
    } catch (error) {
      notify('danger', apiErrorMessage(error, 'No se pudo cargar el historial.'));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load(applied);
  }, [applied, load]);

  if (loading && !ventas.length) return <PageLoader text="Cargando historial..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Historial de ventas</h1>
          <p>Consulta de comprobantes y lotes utilizados</p>
        </div>
        <Link className="btn btn-primary" to="/ventas">Nueva venta</Link>
      </div>

      <div className="panel mb-4">
        <form
          className="row g-2"
          onSubmit={(event) => {
            event.preventDefault();
            setApplied({ ...filters });
          }}
        >
          <div className="col-md-4">
            <input
              className="form-control"
              name="q"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              placeholder="Número o cliente"
            />
          </div>
          <div className="col-md-3">
            <input
              type="date"
              className="form-control"
              name="desde"
              value={filters.desde}
              onChange={(event) => setFilters((current) => ({ ...current, desde: event.target.value }))}
            />
          </div>
          <div className="col-md-3">
            <input
              type="date"
              className="form-control"
              name="hasta"
              value={filters.hasta}
              onChange={(event) => setFilters((current) => ({ ...current, hasta: event.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-primary w-100" type="submit">Buscar</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Método</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => (
                <tr key={venta.id}>
                  <td><strong>{venta.numero}</strong></td>
                  <td>{isoToDisplayDateTime(venta.creado_en)}</td>
                  <td>{venta.usuario}</td>
                  <td>{venta.cliente_nombre || 'Público general'}</td>
                  <td>{number(venta.items)}</td>
                  <td>{methodLabel(venta.metodo_pago)}</td>
                  <td className="fw-bold">{money(venta.total)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      onClick={() => setReceiptId(venta.id)}
                      aria-label="Ver comprobante"
                    >
                      <i className="bi bi-eye" />
                    </button>
                  </td>
                </tr>
              ))}
              {!ventas.length && (
                <tr><td colSpan="8" className="empty-state">No hay ventas para mostrar</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiptModal saleId={receiptId} onClose={() => setReceiptId(null)} />
    </>
  );
}
