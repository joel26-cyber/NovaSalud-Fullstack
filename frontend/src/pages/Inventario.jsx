import { useCallback, useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { api, apiErrorMessage } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import { isoToDisplayDateTime, number } from '../utils/format';

const adjustmentSchema = Yup.object({
  lote_id: Yup.string().required('Selecciona un lote.'),
  tipo: Yup.string().oneOf(['ajuste_entrada', 'ajuste_salida']).required('Selecciona el tipo de ajuste.'),
  cantidad: Yup.number()
    .typeError('Ingresa una cantidad válida.')
    .integer('Debe ser un entero.')
    .min(1, 'La cantidad debe ser al menos 1.')
    .required('La cantidad es obligatoria.'),
  motivo: Yup.string().trim().min(4, 'El motivo debe tener al menos 4 caracteres.').required('El motivo es obligatorio.'),
});

const MOVEMENT_LABELS = {
  entrada: 'Entrada',
  ajuste_entrada: 'Ajuste +',
  ajuste_salida: 'Ajuste -',
  venta: 'Venta',
};

export default function Inventario() {
  const confirm = useConfirm();
  const { notify } = useToast();
  const [movimientos, setMovimientos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ tipo: '', desde: '', hasta: '' });
  const [applied, setApplied] = useState(filters);

  const loadLotes = useCallback(async () => {
    try {
      const { data } = await api.get('/inventario/lotes');
      setLotes(data.lotes || []);
    } catch (error) {
      notify('danger', apiErrorMessage(error, 'No se pudieron cargar los lotes.'));
    }
  }, [notify]);

  const loadMovements = useCallback(async (currentFilters) => {
    try {
      const { data } = await api.get('/inventario', {
        params: {
          tipo: currentFilters.tipo || undefined,
          desde: currentFilters.desde || undefined,
          hasta: currentFilters.hasta || undefined,
        },
      });
      setMovimientos(data.movimientos || []);
    } catch (error) {
      notify('danger', apiErrorMessage(error, 'No se pudieron cargar los movimientos.'));
    }
  }, [notify]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadMovements(applied), loadLotes()]).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [applied, loadLotes, loadMovements]);

  const handleAdjustment = async (values, { setSubmitting, setStatus, resetForm }) => {
    setStatus(null);
    const accepted = await confirm({
      title: 'Registrar ajuste',
      message: `Se ${values.tipo === 'ajuste_entrada' ? 'aumentará' : 'disminuirá'} el stock del lote seleccionado en ${values.cantidad} unidades. ¿Confirmas la operación?`,
      confirmText: 'Sí, registrar ajuste',
    });
    if (!accepted) {
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/inventario/ajuste', values);
      notify('success', 'Ajuste registrado correctamente.');
      resetForm();
      await Promise.all([loadMovements(applied), loadLotes()]);
    } catch (error) {
      setStatus(apiErrorMessage(error, 'No se pudo registrar el ajuste.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !movimientos.length) return <PageLoader text="Cargando inventario..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Movimientos de inventario</h1>
          <p>Historial auditable de entradas, ajustes y ventas</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-4">
          <div className="panel sticky-xl-top" style={{ top: 85 }}>
            <h2 className="h5 mb-3">Registrar ajuste</h2>
            <Formik
              initialValues={{ lote_id: '', tipo: 'ajuste_entrada', cantidad: '', motivo: '' }}
              validationSchema={adjustmentSchema}
              onSubmit={handleAdjustment}
            >
              {({ isSubmitting, status, errors, touched }) => (
                <Form>
                  <label className="form-label" htmlFor="lote_id">Lote</label>
                  <Field
                    as="select"
                    id="lote_id"
                    name="lote_id"
                    className={`form-select mb-3 ${touched.lote_id && errors.lote_id ? 'is-invalid' : ''}`}
                  >
                    <option value="">Seleccionar</option>
                    {lotes.map((lote) => (
                      <option key={lote.id} value={lote.id}>
                        {lote.nombre} · {lote.numero_lote} · stock {lote.cantidad_disponible}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="lote_id" component="div" className="invalid-feedback d-block mb-3" />

                  <label className="form-label" htmlFor="tipo">Tipo</label>
                  <Field as="select" id="tipo" name="tipo" className="form-select mb-3">
                    <option value="ajuste_entrada">Aumentar stock</option>
                    <option value="ajuste_salida">Disminuir stock</option>
                  </Field>

                  <label className="form-label" htmlFor="cantidad">Cantidad</label>
                  <Field
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    min="1"
                    className={`form-control mb-3 ${touched.cantidad && errors.cantidad ? 'is-invalid' : ''}`}
                  />
                  <ErrorMessage name="cantidad" component="div" className="invalid-feedback d-block mb-3" />

                  <label className="form-label" htmlFor="motivo">Motivo</label>
                  <Field
                    as="textarea"
                    id="motivo"
                    name="motivo"
                    rows="3"
                    className={`form-control mb-3 ${touched.motivo && errors.motivo ? 'is-invalid' : ''}`}
                  />
                  <ErrorMessage name="motivo" component="div" className="invalid-feedback d-block mb-3" />

                  {status && <div className="alert alert-danger py-2">{status}</div>}

                  <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Registrando...' : 'Registrar movimiento'}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="panel mb-3">
            <form
              className="row g-2"
              onSubmit={(event) => {
                event.preventDefault();
                setApplied({ ...filters });
              }}
            >
              <div className="col-md-4">
                <select
                  className="form-select"
                  name="tipo"
                  value={filters.tipo}
                  onChange={(event) => setFilters((current) => ({ ...current, tipo: event.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="entrada">Entradas</option>
                  <option value="ajuste_entrada">Ajustes +</option>
                  <option value="ajuste_salida">Ajustes -</option>
                  <option value="venta">Ventas</option>
                </select>
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
                <button className="btn btn-outline-primary w-100" type="submit">Filtrar</button>
              </div>
            </form>
          </div>

          <div className="panel">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Medicamento / lote</th>
                    <th>Tipo</th>
                    <th>Cambio</th>
                    <th>Stock</th>
                    <th>Usuario / motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td>{isoToDisplayDateTime(movimiento.creado_en)}</td>
                      <td>
                        <strong>{movimiento.nombre}</strong>
                        <small className="d-block">{movimiento.numero_lote}</small>
                      </td>
                      <td>{MOVEMENT_LABELS[movimiento.tipo] || movimiento.tipo}</td>
                      <td className={`fw-bold ${Number(movimiento.cantidad) < 0 ? 'text-danger' : 'text-success'}`}>
                        {Number(movimiento.cantidad) > 0 ? '+' : ''}{number(movimiento.cantidad)}
                      </td>
                      <td>{number(movimiento.stock_anterior)} → {number(movimiento.stock_posterior)}</td>
                      <td>
                        {movimiento.usuario}
                        <small className="d-block text-muted">{movimiento.motivo}</small>
                      </td>
                    </tr>
                  ))}
                  {!movimientos.length && (
                    <tr><td colSpan="6" className="empty-state">No hay movimientos para los filtros seleccionados</td></tr>
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
