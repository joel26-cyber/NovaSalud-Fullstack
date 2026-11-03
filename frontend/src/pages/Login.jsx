import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';

const loginSchema = Yup.object({
  usuario: Yup.string().trim().required('Ingresa tu usuario.'),
  password: Yup.string().required('Ingresa tu contraseña.'),
});

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  if (user) {
    const destination = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    setServerError('');
    try {
      await login(values.usuario.trim(), values.password);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(apiErrorMessage(error, 'Usuario o contraseña incorrectos.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <main className="login-wrapper">
        <div className="login-ambient-orb orb-1" />
        <div className="login-ambient-orb orb-2" />

        <div className="card shadow-lg login-card mx-auto">
          <div className="card-body p-4 p-sm-5">
            <div className="text-center mb-4">
              <img src="/assets/img/logo-stacked.png" alt="NOVA SALUD" className="login-brand-img" />
              <div className="login-system-pill mt-3">
                <span className="online-indicator" />Plataforma Clínica & Ventas
              </div>
            </div>

            {serverError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill" />
                <div>{serverError}</div>
              </div>
            )}

            <Formik
              initialValues={{ usuario: '', password: '' }}
              validationSchema={loginSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form autoComplete="off" noValidate>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="usuario">Usuario del sistema</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-person-badge" /></span>
                      <Field
                        id="usuario"
                        name="usuario"
                        className={`form-control form-control-lg ${touched.usuario && errors.usuario ? 'is-invalid' : ''}`}
                        placeholder="Ingresa tu usuario"
                        autoComplete="username"
                        autoFocus
                      />
                    </div>
                    <ErrorMessage name="usuario" component="div" className="invalid-feedback d-block" />
                  </div>

                  <div className="mb-4">
                    <label className="form-label" htmlFor="password">Contraseña de acceso</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-shield-lock" /></span>
                      <Field
                        id="password"
                        name="password"
                        type="password"
                        className={`form-control form-control-lg ${touched.password && errors.password ? 'is-invalid' : ''}`}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>
                    <ErrorMessage name="password" component="div" className="invalid-feedback d-block" />
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg w-100 py-3 login-btn" disabled={isSubmitting}>
                    <span>{isSubmitting ? 'Ingresando...' : 'Ingresar al Sistema'}</span>
                    <i className={`bi ${isSubmitting ? 'bi-hourglass-split' : 'bi-arrow-right'}`} />
                  </button>

                  {import.meta.env.DEV && (
                    <p className="text-center small mt-3 mb-0 login-demo">
                      Demo: <strong>admin</strong> / <strong>NovaSalud2026</strong>
                    </p>
                  )}
                </Form>
              )}
            </Formik>
          </div>

          <div className="login-footer text-center pb-4">
            <small>© {new Date().getFullYear()} NovaSalud</small>
          </div>
        </div>
      </main>
    </div>
  );
}
