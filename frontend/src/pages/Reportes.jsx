import { useCallback, useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import { firstDayOfMonth, isoToDisplay, money, number, todayIso } from '../utils/format';

export default function Reportes() {
  const { notify } = useToast();
  const [diarias, setDiarias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [filters, setFilters] = useState({ desde: firstDayOfMonth(), hasta: todayIso() });
  const [applied, setApplied] = useState(filters);

  const load = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const { data } = await api.get('/reportes', { params: currentFilters });
      setDiarias(data.diarias || []);
      setProductos(data.productos || []);
    } catch (error) {
      notify('danger', apiErrorMessage(error, 'No se pudieron cargar los reportes.'));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load(applied);
  }, [applied, load]);

  const download = async (tipo, formato) => {
    const key = `${tipo}-${formato}`;
    setDownloading(key);
    try {
      const response = await api.get(`/reportes/${formato}`, {
        params: { tipo, desde: applied.desde, hasta: applied.hasta },
        responseType: 'blob',
      });
      const disposition = response.headers['content-disposition'] || '';
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      const filename = match?.[1] || `reporte_${tipo}.${formato}`;
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify('success', 'Reporte descargado correctamente.');
    } catch (error) {
      let message = 'No se pudo descargar el reporte.';
      if (error.response?.data instanceof Blob) {
        try {
          const parsed = JSON.parse(await error.response.data.text());
          message = parsed.message || message;
        } catch {
          // Mantener el mensaje genérico si el cuerpo no es JSON.
        }
      } else {
        message = apiErrorMessage(error, message);
      }
      notify('danger', message);
    } finally {
      setDownloading('');
    }
  };

  if (loading && !diarias.length && !productos.length) return <PageLoader text="Cargando reportes..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Reportes</h1>
          <p>Indicadores obtenidos directamente de la base de datos</p>
        </div>
        <div className="d-flex flex-wrap gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={() => download('ventas', 'csv')}
            disabled={Boolean(downloading)}
          >
            <i className="bi bi-filetype-csv" /> Ventas CSV
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => download('ventas', 'pdf')}
            disabled={Boolean(downloading)}
          >
            <i className="bi bi-filetype-pdf" /> Ventas PDF
          </button>
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={() => download('stock', 'csv')}
            disabled={Boolean(downloading)}
          >
            <i className="bi bi-filetype-csv" /> Stock CSV
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => download('stock', 'pdf')}
            disabled={Boolean(downloading)}
          >
            <i className="bi bi-filetype-pdf" /> Stock PDF
          </button>
        </div>
      </div>

      <div className="panel mb-4">
        <form
          className="row g-2"
          onSubmit={(event) => {
            event.preventDefault();
            setApplied({ ...filters });
          }}
        >
          <div className="col-md-5">
            <label className="form-label" htmlFor="desde">Desde</label>
            <input
              id="desde"
              type="date"
              className="form-control"
              name="desde"
              value={filters.desde}
              onChange={(event) => setFilters((current) => ({ ...current, desde: event.target.value }))}
            />
          </div>
          <div className="col-md-5">
            <label className="form-label" htmlFor="hasta">Hasta</label>
            <input
              id="hasta"
              type="date"
              className="form-control"
              name="hasta"
              value={filters.hasta}
              onChange={(event) => setFilters((current) => ({ ...current, hasta: event.target.value }))}
            />
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-primary w-100" type="submit">Consultar</button>
          </div>
        </form>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="panel">
            <h2 className="h5 mb-3">Ventas diarias</h2>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Fecha</th><th>Ventas</th><th>Ingresos</th></tr>
                </thead>
                <tbody>
                  {diarias.map((row) => (
                    <tr key={row.fecha}>
                      <td>{isoToDisplay(row.fecha)}</td>
                      <td>{number(row.ventas)}</td>
                      <td className="fw-bold">{money(row.total)}</td>
                    </tr>
                  ))}
                  {!diarias.length && (
                    <tr><td colSpan="3" className="empty-state">Sin ventas en este periodo</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="panel">
            <h2 className="h5 mb-3">Productos más vendidos</h2>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Producto</th><th>Unidades</th><th>Importe</th></tr>
                </thead>
                <tbody>
                  {productos.map((row) => (
                    <tr key={row.codigo}>
                      <td>
                        <strong>{row.nombre}</strong>
                        <small className="d-block">{row.codigo}</small>
                      </td>
                      <td>{number(row.cantidad)}</td>
                      <td>{money(row.importe)}</td>
                    </tr>
                  ))}
                  {!productos.length && (
                    <tr><td colSpan="3" className="empty-state">Sin datos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
