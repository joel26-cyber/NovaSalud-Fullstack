import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { api, apiErrorMessage, uploadUrl } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';

const medicamentoSchema = Yup.object({
  codigo: Yup.string().trim().required('El código es obligatorio.').max(30, 'Máximo 30 caracteres.'),
  nombre: Yup.string().trim().required('El nombre es obligatorio.').max(120, 'Máximo 120 caracteres.'),
  categoria_id: Yup.string().required('Selecciona una categoría.'),
  concentracion: Yup.string().max(80, 'Máximo 80 caracteres.'),
  presentacion: Yup.string().max(80, 'Máximo 80 caracteres.'),
  laboratorio: Yup.string().max(120, 'Máximo 120 caracteres.'),
  precio_venta: Yup.number().typeError('Ingresa un precio válido.').min(0, 'El precio no puede ser negativo.').required('El precio es obligatorio.'),
  stock_minimo: Yup.number().typeError('Ingresa un número válido.').integer('Debe ser un entero.').min(0, 'No puede ser negativo.').required('El stock mínimo es obligatorio.'),
});

const emptyValues = {
  codigo: '',
  nombre: '',
  categoria_id: '',
  concentracion: '',
  presentacion: '',
  laboratorio: '',
  precio_venta: '',
  stock_minimo: 5,
  imagen: null,
};

export default function MedicamentoForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { notify } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [initialValues, setInitialValues] = useState(emptyValues);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let active = true;
    const requests = [api.get('/medicamentos/categorias')];
    if (isEdit) requests.push(api.get(`/medicamentos/${id}`));

    Promise.all(requests)
      .then(([categoriesResponse, medicamentoResponse]) => {
        if (!active) return;
        setCategorias(categoriesResponse.data.categorias || []);
        if (medicamentoResponse) {
          const med = medicamentoResponse.data.medicamento;
          setInitialValues({
            codigo: med.codigo || '',
            nombre: med.nombre || '',
            categoria_id: String(med.categoria_id || ''),
            concentracion: med.concentracion || '',
            presentacion: med.presentacion || '',
            laboratorio: med.laboratorio || '',
            precio_venta: med.precio_venta ?? '',
            stock_minimo: med.stock_minimo ?? 5,
            imagen: null,
          });
          setCurrentImage(med.imagen || null);
        }
      })
      .catch((error) => {
        notify('danger', apiErrorMessage(error, 'No se pudo cargar el formulario.'));
        navigate('/medicamentos', { replace: true });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id, isEdit, navigate, notify]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const imagePreview = useMemo(() => preview || uploadUrl(currentImage), [preview, currentImage]);

  if (loading) return <PageLoader text="Cargando formulario..." />;

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null);
    const formData = new FormData();
    formData.append('codigo', values.codigo);
    formData.append('nombre', values.nombre);
    formData.append('categoria_id', values.categoria_id);
    formData.append('concentracion', values.concentracion || '');
    formData.append('presentacion', values.presentacion || '');
    formData.append('laboratorio', values.laboratorio || '');
    formData.append('precio_venta', values.precio_venta);
    formData.append('stock_minimo', values.stock_minimo);
    if (values.imagen) formData.append('imagen', values.imagen);

    try {
      if (isEdit) {
        await api.put(`/medicamentos/${id}`, formData);
        notify('success', 'Medicamento actualizado correctamente.');
      } else {
        await api.post('/medicamentos', formData);
        notify('success', 'Medicamento registrado correctamente.');
      }
      navigate('/medicamentos');
    } catch (error) {
      setStatus(apiErrorMessage(error, 'No se pudo guardar el medicamento.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{isEdit ? 'Editar' : 'Registrar'} medicamento</h1>
          <p>La fecha de vencimiento se registra posteriormente en cada lote</p>
        </div>
        <Link className="btn btn-light" to="/medicamentos">Volver</Link>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={medicamentoSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, status, setFieldValue, errors, touched }) => (
          <Form className="panel">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label" htmlFor="codigo">Código único *</label>
                <Field
                  id="codigo"
                  name="codigo"
                  maxLength="30"
                  className={`form-control ${touched.codigo && errors.codigo ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="codigo" component="div" className="invalid-feedback d-block" />
              </div>
              <div className="col-md-8">
                <label className="form-label" htmlFor="nombre">Nombre *</label>
                <Field
                  id="nombre"
                  name="nombre"
                  maxLength="120"
                  className={`form-control ${touched.nombre && errors.nombre ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="nombre" component="div" className="invalid-feedback d-block" />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="categoria_id">Categoría *</label>
                <Field
                  as="select"
                  id="categoria_id"
                  name="categoria_id"
                  className={`form-select ${touched.categoria_id && errors.categoria_id ? 'is-invalid' : ''}`}
                >
                  <option value="">Seleccionar</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                  ))}
                </Field>
                <ErrorMessage name="categoria_id" component="div" className="invalid-feedback d-block" />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="concentracion">Concentración</label>
                <Field id="concentracion" name="concentracion" className="form-control" />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="presentacion">Presentación</label>
                <Field id="presentacion" name="presentacion" className="form-control" />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="laboratorio">Laboratorio / fabricante</label>
                <Field id="laboratorio" name="laboratorio" className="form-control" />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="precio_venta">Precio de venta (S/) *</label>
                <Field
                  id="precio_venta"
                  name="precio_venta"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-control ${touched.precio_venta && errors.precio_venta ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="precio_venta" component="div" className="invalid-feedback d-block" />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="stock_minimo">Stock mínimo *</label>
                <Field
                  id="stock_minimo"
                  name="stock_minimo"
                  type="number"
                  min="0"
                  className={`form-control ${touched.stock_minimo && errors.stock_minimo ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="stock_minimo" component="div" className="invalid-feedback d-block" />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="imagen">Imagen opcional</label>
                <input
                  id="imagen"
                  type="file"
                  className="form-control"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    if (file && file.size > 2 * 1024 * 1024) {
                      notify('danger', 'La imagen debe pesar menos de 2 MB.');
                      event.target.value = '';
                      return;
                    }
                    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                      notify('danger', 'La imagen debe ser JPG, PNG o WEBP.');
                      event.target.value = '';
                      return;
                    }
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview(file ? URL.createObjectURL(file) : null);
                    setFieldValue('imagen', file);
                  }}
                />
                <small className="text-muted">JPG, PNG o WEBP. Máximo 2 MB.</small>
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Vista previa" style={{ maxHeight: 90, maxWidth: '100%', borderRadius: 8 }} />
                  </div>
                )}
              </div>
              <div className="col-12">
                {status && <div className="alert alert-danger py-2 mb-3">{status}</div>}
              </div>
              <div className="col-12 text-end">
                <button className="btn btn-primary px-4" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar medicamento'}
                </button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
