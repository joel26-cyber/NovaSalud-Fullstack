import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import { money, number } from '../utils/format';

export default function Medicamentos() {
  const { isAdmin } = useAuth();
  const confirm = useConfirm();
  const { notify } = useToast();
  const [medicamentos, setMedicamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', categoria: '' });
  const [applied, setApplied] = useState({ q: '', categoria: '' });

  const load = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const { data } = await api.get('/medicamentos', {
        params: {
          q: currentFilters.q || undefined,
          categoria: currentFilters.categoria || undefined,
        },
      });
      setMedicamentos(data.medicamentos || []);
    } catch (error) {
      notify('danger', apiErrorMessage(error, 'No se pudieron cargar los medicamentos.'));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    api.get('/medicamentos/categorias')
      .then(({ data }) => setCategorias(data.categorias || []))
      .catch((error) => notify('danger', apiErrorMessage(error, 'No se pudieron cargar las categorías.')));
  }, [notify]);

  useEffect(() => {
    load(applied);
  }, [applied, load]);

  const handleSearch = (event) => {
    event.preventDefault();
    setApplied({ ...filters });
  };

  const handleToggle = async (medicamento) => {
    const accepted = await confirm({
      title: 'Cambiar estado',
      message: `¿Deseas ${medicamento.activo ? 'desactivar' : 'activar'} el medicamento ${medicamento.nombre}?`,
      confirmText: 'Sí, cambiar estado',
    });
    if (!accepted) return;

    try {
      await api.patch(`/medicamentos/${medicamento.id}/toggle`);
      notify('success', 'Estado del medicamento actualizado.');
      load(applied);
    } catch (error) {
      notify('danger', apiErrorMessage(error, 'No se pudo actualizar el estado.'));
    }
  };

  if (loading && !medicamentos.length) return <PageLoader text="Cargando catálogo..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Medicamentos</h1>
          <p>Catálogo y existencias disponibles para la venta</p>
        </div>
        {isAdmin && (
          <Link className="btn btn-primary" to="/medicamentos/nuevo">
            <i className="bi bi-plus-lg" /> Registrar
          </Link>
        )}
      </div>

      <div className="panel mb-4">
        <form className="row g-2" onSubmit={handleSearch}>
          <div className="col-md-7">
            <input
              className="form-control"
              name="q"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              placeholder="Buscar por nombre, código o laboratorio"
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              name="categoria"
              value={filters.categoria}
              onChange={(event) => setFilters((current) => ({ ...current, categoria: event.target.value }))}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
              ))}
            </select>
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
                <th>Código</th>
                <th>Medicamento</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {medicamentos.map((medicamento) => (
                <tr key={medicamento.id}>
                  <td><span className="code-chip">{medicamento.codigo}</span></td>
                  <td>
                    <strong>{medicamento.nombre}</strong>
                    <small className="d-block text-muted">
                      {[medicamento.concentracion, medicamento.presentacion].filter(Boolean).join(' · ')}
                    </small>
                  </td>
                  <td>{medicamento.categoria}</td>
                  <td>{money(medicamento.precio_venta)}</td>
                  <td>
                    <strong className={Number(medicamento.stock) <= Number(medicamento.stock_minimo) ? 'text-danger' : ''}>
                      {number(medicamento.stock)}
                    </strong>{' '}
                    <small>/ mín. {number(medicamento.stock_minimo)}</small>
                  </td>
                  <td>
                    <span className={`badge text-bg-${Number(medicamento.activo) ? 'success' : 'secondary'}`}>
                      {Number(medicamento.activo) ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-nowrap">
                    {isAdmin && (
                      <div className="table-actions">
                        <Link className="btn btn-sm btn-light" to={`/medicamentos/${medicamento.id}/editar`} title="Editar">
                          <i className="bi bi-pencil" />
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-light"
                          onClick={() => handleToggle(medicamento)}
                          title="Cambiar estado"
                        >
                          <i className="bi bi-power" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!medicamentos.length && (
                <tr><td colSpan="7" className="empty-state">No se encontraron medicamentos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
