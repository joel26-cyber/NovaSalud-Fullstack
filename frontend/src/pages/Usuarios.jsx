import { useCallback, useEffect, useMemo, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { api, apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import { isoToDisplayDateTime, number, ucfirst } from '../utils/format';

const usuarioSchema = Yup.object({
  nombres: Yup.string()
    .trim()
    .required('Los nombres son obligatorios.')
    .min(3, 'Ingresa al menos 3 caracteres.')
    .max(100, 'Máximo 100 caracteres.'),
  usuario: Yup.string()
    .trim()
    .required('El usuario es obligatorio.')
    .matches(
      /^[A-Za-z0-9_.-]{4,30}$/,
      'Entre 4 y 30 caracteres: letras, números, punto, guion o guion bajo.',
    ),
  clave: Yup.string()
    .required('La contraseña es obligatoria.')
    .min(10, 'La contraseña debe tener al menos 10 caracteres.')
    .max(72, 'Máximo 72 caracteres.'),
  rol_id: Yup.string().oneOf(['1', '2'], 'Selecciona un rol válido.').required('Selecciona un rol.'),
});

const configSchema = Yup.object({
  dias: Yup.number()
    .typeError('Ingresa un número válido.')
    .integer('Debe ser un número entero.')
    .min(1, 'El mínimo es 1 día.')
    .max(365, 'El máximo es 365 días.')
    .required('Los días de anticipación son obligatorios.'),
});

const initialUsuario = { nombres: '', usuario: '', clave: '', rol_id: '2' };

export default function Usuarios() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [dias, setDias] = useState(30);
  const [loading, setLoading] = useState(true);
  const [claveVisible, setClaveVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data.usuarios || []);
      setDias(Number(data.dias || 30));
    } catch (error) {
      notify('danger', apiErrorMessage(error, 'No se pudieron cargar los usuarios.'));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const configInitial = useMemo(() => ({ dias: String(dias) }), [dias]);

  const stats = useMemo(() => {
    const admins = usuarios.filter((item) => item.rol === 'administrador').length;
    const sellers = usuarios.filter((item) => item.rol === 'vendedor').length;
    const activos = usuarios.filter((item) => Number(item.activo) === 1).length;
    return { admins, sellers, activos };
  }, [usuarios]);

  const handleCreate = async (values, { setSubmitting, setStatus, resetForm }) => {
    setStatus(null);
    try {
      await api.post('/usuarios', {
        nombres: values.nombres.trim(),
        usuario: values.usuario.trim(),
        clave: values.clave,
        rol_id: Number(values.rol_id),
      });
      notify('success', `Usuario ${values.usuario.trim()} creado correctamente.`);
      resetForm();
      setClaveVisible(false);
      await load();
    } catch (error) {
      setStatus(apiErrorMessage(error, 'No se pudo crear el usuario.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfig = async (values, { setSubmitting, setStatus }) => {
    setStatus(null);
    try {
      const { data } = await api.put('/usuarios/config', { dias: Number(values.dias) });
      setDias(Number(data.dias || values.dias));
      notify('success', data.message || 'Configuración actualizada correctamente.');
    } catch (error) {
      setStatus(apiErrorMessage(error, 'No se pudo actualizar la configuración.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !usuarios.length) return <PageLoader text="Cargando usuarios y ajustes..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Usuarios y ajustes</h1>
          <p>Administra los accesos al sistema y las reglas operativas de vencimiento</p>
        </div>
        <span className="badge text-bg-light border text-muted px-3 py-2">
          <i className="bi bi-shield-check me-1 text-danger" />
          Solo administradores
        </span>
      </div>

      <div className="row g-2 mb-4">
        <div className="col-6 col-xl-3">
          <div className="stat-card compact-stat">
            <div className="stat-icon stat-icon-sm bg-primary-subtle text-primary">
              <i className="bi bi-people" />
            </div>
            <div className="stat-content">
              <small>Usuarios</small>
              <strong>{number(usuarios.length)}</strong>
            </div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="stat-card compact-stat">
            <div className="stat-icon stat-icon-sm bg-danger-subtle text-danger">
              <i className="bi bi-person-gear" />
            </div>
            <div className="stat-content">
              <small>Administradores</small>
              <strong>{number(stats.admins)}</strong>
            </div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="stat-card compact-stat">
            <div className="stat-icon stat-icon-sm bg-info-subtle text-info">
              <i className="bi bi-person-badge" />
            </div>
            <div className="stat-content">
              <small>Vendedores</small>
              <strong>{number(stats.sellers)}</strong>
            </div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="stat-card compact-stat">
            <div className="stat-icon stat-icon-sm bg-success-subtle text-success">
              <i className="bi bi-check2-circle" />
            </div>
            <div className="stat-content">
              <small>Cuentas activas</small>
              <strong>{number(stats.activos)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-5">
          <Formik
            initialValues={initialUsuario}
            validationSchema={usuarioSchema}
            onSubmit={handleCreate}
          >
            {({ isSubmitting, status, errors, touched }) => (
              <Form className="panel mb-4" noValidate>
                <div className="panel-title">
                  <h2><i className="bi bi-person-plus me-2 text-danger" />Nuevo usuario</h2>
                </div>

                <label className="form-label" htmlFor="nombres">Nombres completos *</label>
                <Field
                  id="nombres"
                  name="nombres"
                  maxLength="100"
                  autoComplete="off"
                  className={`form-control mb-1 ${touched.nombres && errors.nombres ? 'is-invalid' : ''}`}
                  placeholder="Ej. María Fernanda López"
                />
                <ErrorMessage name="nombres" component="div" className="invalid-feedback d-block mb-3" />

                <label className="form-label" htmlFor="usuario">Nombre de usuario *</label>
                <Field
                  id="usuario"
                  name="usuario"
                  maxLength="30"
                  autoComplete="off"
                  className={`form-control mb-1 ${touched.usuario && errors.usuario ? 'is-invalid' : ''}`}
                  placeholder="Ej. mlopez"
                />
                <ErrorMessage name="usuario" component="div" className="invalid-feedback d-block mb-3" />

                <label className="form-label" htmlFor="clave">Contraseña *</label>
                <div className="input-group mb-1">
                  <Field
                    id="clave"
                    name="clave"
                    type={claveVisible ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`form-control ${touched.clave && errors.clave ? 'is-invalid' : ''}`}
                    placeholder="Mínimo 10 caracteres"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setClaveVisible((current) => !current)}
                    aria-label={claveVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    <i className={`bi ${claveVisible ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
                <ErrorMessage name="clave" component="div" className="invalid-feedback d-block mb-3" />

                <label className="form-label" htmlFor="rol_id">Rol *</label>
                <Field
                  as="select"
                  id="rol_id"
                  name="rol_id"
                  className={`form-select mb-3 ${touched.rol_id && errors.rol_id ? 'is-invalid' : ''}`}
                >
                  <option value="2">Vendedor</option>
                  <option value="1">Administrador</option>
                </Field>
                <ErrorMessage name="rol_id" component="div" className="invalid-feedback d-block mb-3" />

                {status && <div className="alert alert-danger py-2">{status}</div>}

                <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando usuario...' : 'Crear usuario'}
                </button>
              </Form>
            )}
          </Formik>

          <Formik
            initialValues={configInitial}
            validationSchema={configSchema}
            enableReinitialize
            onSubmit={handleConfig}
          >
            {({ isSubmitting, status, errors, touched }) => (
              <Form className="panel" noValidate>
                <div className="panel-title">
                  <h2><i className="bi bi-alarm me-2 text-danger" />Alertas de vencimiento</h2>
                </div>

                <label className="form-label" htmlFor="dias">Días de anticipación *</label>
                <Field
                  id="dias"
                  name="dias"
                  type="number"
                  min="1"
                  max="365"
                  className={`form-control mb-1 ${touched.dias && errors.dias ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="dias" component="div" className="invalid-feedback d-block mb-2" />
                <p className="form-text mb-3">
                  Los lotes que venzan dentro de este rango se mostrarán como
                  <strong> próximos a vencer</strong> en el dashboard y en el control de vencimientos.
                </p>

                {status && <div className="alert alert-danger py-2">{status}</div>}

                <button className="btn btn-outline-primary w-100" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </Form>
            )}
          </Formik>
        </div>

        <div className="col-xl-7">
          <div className="panel">
            <div className="panel-title">
              <h2><i className="bi bi-people me-2 text-danger" />Usuarios registrados</h2>
              <span className="badge text-bg-light border text-muted">{number(usuarios.length)} cuentas</span>
            </div>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Último acceso</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="user-avatar" aria-hidden="true">
                            {String(item.nombres || '?').trim().charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>
                              {item.nombres}
                              {Number(item.id) === Number(user?.id) && (
                                <span className="badge text-bg-danger ms-2">Tú</span>
                              )}
                            </strong>
                            <small className="d-block text-muted">@{item.usuario}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge text-bg-${item.rol === 'administrador' ? 'danger' : 'info'}`}>
                          {ucfirst(item.rol)}
                        </span>
                      </td>
                      <td className="text-nowrap">{isoToDisplayDateTime(item.ultimo_acceso)}</td>
                      <td>
                        <span className={`badge text-bg-${Number(item.activo) ? 'success' : 'secondary'}`}>
                          {Number(item.activo) ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!usuarios.length && (
                    <tr><td colSpan="4" className="empty-state">No hay usuarios registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-muted small mb-0 mt-3">
              <i className="bi bi-info-circle me-1" />
              Las cuentas existentes conservan su contraseña. Por seguridad, las nuevas claves exigen
              un mínimo de 10 caracteres y se almacenan cifradas con bcrypt.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
