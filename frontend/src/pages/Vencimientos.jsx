import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import { isoToDisplay, number } from '../utils/format';

export default function Vencimientos() {
  const { notify } = useToast();
  const [lotes, setLotes] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [diasAlerta, setDiasAlerta] = useState(30);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: 'todos',
    medicamento: '',
    desde: '',
    hasta: '',
  });
  const [applied, setApplied] = useState(filters);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/lotes/vencimientos', {
      params: {
        estado: applied.estado,
        medicamento: applied.medicamento || undefined,
        desde: applied.desde || undefined,
        hasta: applied.hasta || undefined,
      },
    })
      .then(({ data }) => {
        if (!active) return;
        setLotes(data.lotes || []);
        setMedicamentos(data.medicamentos || []);
        setDiasAlerta(Number(data.dias || 30));
      })
      .catch((error) => {
        if (active) notify('danger', apiErrorMessage(error, 'No se pudieron cargar los vencimientos.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [applied, notify]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setApplied({ ...filters });
  };

  if (loading && !lotes.length) return <PageLoader text="Cargando vencimientos..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Control de vencimientos</h1>
          <p>Clasificación automática con alerta de {diasAlerta} días</p>
        </div>
      </div>

      <div className="panel mb-4">
        <form className="row g-2" onSubmit={handleSubmit}>
          <div className="col-md-2">
            <select
              className="form-select"
              name="estado"
              value={filters.estado}
              onChange={(event) => setFilters((current) => ({ ...current, estado: event.target.value }))}
            >
              <option value="todos">Todos</option>
              <option value="proximo">Próximos</option>
              <option value="vencido">Vencidos</option>
              <option value="vigente">Vigentes</option>
            </select>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              name="medicamento"
              value={filters.medicamento}
              onChange={(event) => setFilters((current) => ({ ...current, medicamento: event.target.value }))}
            >
              <option value="">Todos los medicamentos</option>
              {medicamentos.map((medicamento) => (
                <option key={medicamento.id} value={medicamento.id}>{medicamento.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              name="desde"
              value={filters.desde}
              onChange={(event) => setFilters((current) => ({ ...current, desde: event.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              name="hasta"
              value={filters.hasta}
              onChange={(event) => setFilters((current) => ({ ...current, hasta: event.target.value }))}
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-primary w-100" type="submit">Filtrar</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Días restantes</th>
                <th>Cantidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((lote) => {
                const dias = Number(lote.dias);
                const condition = dias <= 0
                  ? 'Vencido'
                  : (dias <= diasAlerta ? 'Próximo a vencer' : 'Vigente');
                const color = dias <= 0 ? 'danger' : (dias <= diasAlerta ? 'warning' : 'success');
                return (
                  <tr key={lote.id}>
                    <td>
                      <strong>{lote.nombre}</strong>
                      <small className="d-block text-muted">{lote.codigo}</small>
                    </td>
                    <td>{lote.numero_lote}</td>
                    <td>{isoToDisplay(lote.fecha_vencimiento)}</td>
                    <td>{dias}</td>
                    <td>{number(lote.cantidad_disponible)}</td>
                    <td>
                      <span className={`badge text-bg-${color}`}>{condition}</span>
                      {lote.estado === 'bloqueado' && <span className="badge text-bg-dark ms-1">Bloqueado</span>}
                    </td>
                  </tr>
                );
              })}
              {!lotes.length && (
                <tr><td colSpan="6" className="empty-state">No hay lotes para los filtros seleccionados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
