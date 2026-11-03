import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import { isoToDisplay, number } from '../utils/format';

export default function Lotes() {
  const { isAdmin } = useAuth();
  const confirm = useConfirm();
  const { notify } = useToast();
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  const load = useCallback(async (search) => {
    setLoading(true);
    try {
      const { data } = await api.get('/lotes', { params: { q: search || undefined } });
      setLotes(data.lotes || []);
    } catch (error) {
      notify('danger', apiErrorMessage(error, 'No se pudieron cargar los lotes.'));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load(appliedQuery);
  }, [appliedQuery, load]);

  const handleToggle = async (lote) => {
    const accepted = await confirm({
      title: 'Cambiar bloqueo del lote',
      message: `¿Deseas ${lote.estado === 'bloqueado' ? 'habilitar' : 'bloquear'} el lote ${lote.numero_lote} de ${lote.nombre}?`,
      confirmText: 'Sí, cambiar estado',
    });
    if (!accepted) return;

    try {
      await api.patch(`/lotes/${lote.id}/toggle`);
      notify('success', 'Estado del lote actualizado.');
      load(appliedQuery);
    } catch (error) {
      notify('danger', apiErrorMessage(error, 'No se pudo actualizar el lote.'));
    }
  };

  if (loading && !lotes.length) return <PageLoader text="Cargando lotes..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Control de lotes</h1>
          <p>Existencias y trazabilidad por fecha de vencimiento</p>
        </div>
        {isAdmin && (
          <Link className="btn btn-primary" to="/lotes/nuevo">
            <i className="bi bi-plus-lg" /> Nuevo lote
          </Link>
        )}
      </div>

      <div className="panel mb-4">
        <form
          className="row g-2"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedQuery(query);
          }}
        >
          <div className="col-md-10">
            <input
              className="form-control"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar lote, medicamento o código"
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
                <th>Lote</th>
                <th>Medicamento</th>
                <th>Ingreso</th>
                <th>Vencimiento</th>
                <th>Inicial</th>
                <th>Disponible</th>
                <th>Condición</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lotes.map((lote) => {
                const dias = Number(lote.dias);
                const condition = dias <= 0 ? 'Vencido' : (dias <= 30 ? 'Próximo' : 'Vigente');
                const color = dias <= 0 ? 'danger' : (dias <= 30 ? 'warning' : 'success');
                return (
                  <tr key={lote.id}>
                    <td><span className="code-chip">{lote.numero_lote}</span></td>
                    <td>
                      <strong>{lote.nombre}</strong>
                      <small className="d-block text-muted">{lote.codigo}</small>
                    </td>
                    <td>{isoToDisplay(lote.fecha_ingreso)}</td>
                    <td>
                      {isoToDisplay(lote.fecha_vencimiento)}
                      <small className="d-block text-muted">{dias} días</small>
                    </td>
                    <td>{number(lote.cantidad_inicial)}</td>
                    <td className="fw-bold">{number(lote.cantidad_disponible)}</td>
                    <td>
                      <span className={`badge text-bg-${color}`}>{condition}</span>
                      {lote.estado === 'bloqueado' && <span className="badge text-bg-dark ms-1">Bloqueado</span>}
                    </td>
                    <td>
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn btn-sm btn-light"
                          onClick={() => handleToggle(lote)}
                          title="Cambiar bloqueo"
                        >
                          <i className="bi bi-lock" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!lotes.length && (
                <tr><td colSpan="8" className="empty-state">No hay lotes registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
