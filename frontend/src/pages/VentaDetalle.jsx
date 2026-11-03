import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import PageLoader from '../components/PageLoader';
import ReceiptTicket from '../components/ReceiptTicket';

export default function VentaDetalle() {
  const { id } = useParams();
  const [venta, setVenta] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/ventas/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setVenta(data.venta);
        setDetalles(data.detalles || []);
      })
      .catch((requestError) => {
        if (active) setError(apiErrorMessage(requestError, 'No se pudo cargar la venta.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  if (loading) return <PageLoader text="Cargando comprobante..." />;

  if (error) {
    return (
      <>
        <div className="page-heading no-print">
          <div><h1>Comprobante interno</h1><p>Detalle de la venta y trazabilidad FEFO</p></div>
          <Link className="btn btn-light" to="/historial">Volver</Link>
        </div>
        <div className="alert alert-danger">{error}</div>
      </>
    );
  }

  return (
    <>
      <div className="page-heading no-print">
        <div>
          <h1>Comprobante interno</h1>
          <p>Detalle de la venta y trazabilidad FEFO</p>
        </div>
        <div>
          <button className="btn btn-outline-primary" type="button" onClick={() => window.print()}>
            <i className="bi bi-printer" /> Imprimir
          </button>
          <Link className="btn btn-light ms-2" to="/historial">Volver</Link>
        </div>
      </div>

      <div className="receipt-page-wrap">
        <ReceiptTicket venta={venta} detalles={detalles} />
      </div>
    </>
  );
}
