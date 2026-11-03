import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { api, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import { todayIso } from '../utils/format';

const loteSchema = Yup.object({
  medicamento_id: Yup.string().required('Selecciona un medicamento.'),
  numero_lote: Yup.string().trim().required('El número de lote es obligatorio.').max(60, 'Máximo 60 caracteres.'),
  fecha_ingreso: Yup.string().required('La fecha de ingreso es obligatoria.'),
  fecha_vencimiento: Yup.string()
    .required('La fecha de vencimiento es obligatoria.')
    .test('after-ingreso', 'La fecha de vencimiento no puede ser anterior al ingreso.', function validate(value) {
      return !value || !this.parent.fecha_ingreso || value >= this.parent.fecha_ingreso;
    }),
  cantidad: Yup.number()
    .typeError('Ingresa una cantidad válida.')
    .integer('Debe ser un entero.')
    .min(1, 'La cantidad debe ser al menos 1.')
    .required('La cantidad es obligatoria.'),
});

export default function LoteForm() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/medicamentos/options')
      .then(({ data }) => {
        if (active) setMedicamentos(data.medicamentos || []);
      })
      .catch((error) => notify('danger', apiErrorMessage(error, 'No se pudieron cargar los medicamentos.')))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [notify]);

  if (loading) return <PageLoader text="Cargando medicamentos..." />;

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null);
    try {
      await api.post('/lotes', values);
      notify('success', 'Lote e ingreso registrados correctamente.');
      navigate('/lotes');
    } catch (error) {
      setStatus(apiErrorMessage(error, 'No se pudo registrar el lote.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Registrar lote</h1>
          <p>El ingreso generará automáticamente un movimiento de inventario</p>
        </div>
        <Link className="btn btn-light" to="/lotes">Volver</Link>
      </div>

      <Formik
        initialValues={{
          medicamento_id: '',
          numero_lote: '',
          fecha_ingreso: todayIso(),
          fecha_vencimiento: '',
          cantidad: '',
        }}
        validationSchema={loteSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, status, errors, touched }) => (
          <Form className="panel">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="medicamento_id">Medicamento *</label>
                <Field
                  as="select"
                  id="medicamento_id"
                  name="medicamento_id"
                  className={`form-select ${touched.medicamento_id && errors.medicamento_id ? 'is-invalid' : ''}`}
                >
                  <option value="">Seleccionar</option>
                  {medicamentos.map((medicamento) => (
                    <option key={medicamento.id} value={medicamento.id}>
                      {medicamento.codigo} — {medicamento.nombre}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="medicamento_id" component="div" className="invalid-feedback d-block" />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="numero_lote">Número de lote *</label>
                <Field
                  id="numero_lote"
                  name="numero_lote"
                  maxLength="60"
                  className={`form-control ${touched.numero_lote && errors.numero_lote ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="numero_lote" component="div" className="invalid-feedback d-block" />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="fecha_ingreso">Fecha de ingreso *</label>
                <Field
                  id="fecha_ingreso"
                  name="fecha_ingreso"
                  type="date"
                  className={`form-control ${touched.fecha_ingreso && errors.fecha_ingreso ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="fecha_ingreso" component="div" className="invalid-feedback d-block" />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="fecha_vencimiento">Fecha de vencimiento *</label>
                <Field
                  id="fecha_vencimiento"
                  name="fecha_vencimiento"
                  type="date"
                  className={`form-control ${touched.fecha_vencimiento && errors.fecha_vencimiento ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="fecha_vencimiento" component="div" className="invalid-feedback d-block" />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="cantidad">Cantidad inicial *</label>
                <Field
                  id="cantidad"
                  name="cantidad"
                  type="number"
                  min="1"
                  className={`form-control ${touched.cantidad && errors.cantidad ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="cantidad" component="div" className="invalid-feedback d-block" />
              </div>
              <div className="col-12">
                {status && <div className="alert alert-danger py-2 mb-0">{status}</div>}
              </div>
              <div className="col-12 text-end">
                <button className="btn btn-primary px-4" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Registrando...' : 'Registrar lote e ingreso'}
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
