import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiErrorMessage, uploadUrl } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import { money } from '../utils/format';

export default function POS() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { notify } = useToast();
  const [productos, setProductos] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/ventas/productos')
      .then(({ data }) => {
        if (!active) return;
        setProductos((data.productos || []).map((producto) => ({
          ...producto,
          detalle: [producto.concentracion, producto.presentacion].filter(Boolean).join(' '),
          precio: Number(producto.precio_venta),
          stock: Number(producto.stock),
        })));
      })
      .catch((error) => {
        if (active) notify('danger', apiErrorMessage(error, 'No se pudieron cargar los productos.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [notify]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    [cart],
  );

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return productos;
    return productos.filter((producto) => (
      `${producto.nombre} ${producto.codigo} ${producto.detalle}`.toLowerCase().includes(query)
    ));
  }, [productos, search]);

  const addProduct = (producto) => {
    if (producto.stock <= 0) {
      setMessage({ type: 'danger', text: `${producto.nombre} está agotado y no puede venderse.` });
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === producto.id);
      if (existing) {
        if (existing.cantidad >= existing.stock) {
          setMessage({
            type: 'warning',
            text: `No puedes agregar más ${existing.nombre}. Alcanzaste el stock disponible (${existing.stock}).`,
          });
          return current;
        }
        return current.map((item) => (
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        ));
      }
      return [...current, { ...producto, cantidad: 1 }];
    });
    setMessage(null);
  };

  const updateQuantity = (id, value) => {
    const requested = Number.parseInt(value, 10) || 1;
    setCart((current) => current.map((item) => {
      if (item.id !== id) return item;
      const cantidad = Math.max(1, Math.min(item.stock, requested));
      if (requested > item.stock) {
        setMessage({ type: 'warning', text: `Solo hay ${item.stock} unidades disponibles de ${item.nombre}.` });
      }
      return { ...item, cantidad };
    }));
  };

  const removeProduct = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
    setMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!cart.length || submitting) return;

    setSubmitting(true);
    setMessage({ type: 'info', text: 'Consultando existencias actuales antes de confirmar…' });

    try {
      const items = cart.map((item) => ({ medicamento_id: item.id, cantidad: item.cantidad }));
      const { data: check } = await api.post('/ventas/stock-check', { items });

      if (!check.ok) {
        const checks = new Map((check.items || []).map((item) => [item.medicamento_id, item]));
        const problems = [];
        const updatedCart = cart.flatMap((item) => {
          const result = checks.get(item.id);
          if (!result) return [item];
          if (result.disponible <= 0) {
            problems.push(`${result.nombre}: AGOTADO`);
            return [];
          }
          if (item.cantidad > result.disponible) {
            problems.push(`${result.nombre}: solo ${result.disponible} disponibles`);
            return [{ ...item, stock: result.disponible, cantidad: result.disponible }];
          }
          return [{ ...item, stock: result.disponible }];
        });

        setCart(updatedCart);
        setProductos((current) => current.map((producto) => {
          const result = checks.get(producto.id);
          return result ? { ...producto, stock: result.disponible } : producto;
        }));
        setMessage({
          type: 'danger',
          text: `Venta bloqueada. ${problems.join(' · ') || check.message}`,
        });
        return;
      }

      setMessage(null);
      const accepted = await confirm({
        title: 'Confirmar venta',
        message: 'El stock está disponible. ¿Deseas registrar la venta y descontar las existencias?',
        confirmText: 'Sí, registrar venta',
      });
      if (!accepted) return;

      const { data: sale } = await api.post('/ventas', {
        items,
        cliente_nombre: clienteNombre,
        cliente_documento: clienteDocumento,
        metodo_pago: metodoPago,
      });

      notify('success', 'Venta registrada correctamente.');
      setCart([]);
      setClienteNombre('');
      setClienteDocumento('');
      setMetodoPago('efectivo');
      navigate(`/ventas/${sale.venta.id}`);
    } catch (error) {
      setMessage({
        type: 'danger',
        text: apiErrorMessage(error, 'No fue posible registrar la venta. Revisa la conexión e inténtalo nuevamente.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader text="Cargando punto de venta..." />;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Punto de venta</h1>
          <p>El sistema seleccionará automáticamente los lotes mediante FEFO</p>
        </div>
      </div>

      <div className="row g-4" id="posApp">
        <div className="col-xl-7">
          <div className="panel">
            <div className="input-group mb-3">
              <span className="input-group-text"><i className="bi bi-search" /></span>
              <input
                className="form-control"
                id="productSearch"
                placeholder="Buscar por nombre o código"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="product-grid" id="productGrid">
              {visibleProducts.map((producto) => (
                <button
                  type="button"
                  key={producto.id}
                  className={`product-card ${producto.stock <= 0 ? 'product-card-disabled' : ''}`}
                  onClick={() => addProduct(producto)}
                  disabled={producto.stock <= 0}
                >
                  <div className="product-header">
                    <div className="product-visual">
                      {producto.imagen ? (
                        <img src={uploadUrl(producto.imagen)} alt={producto.nombre} className="product-img" />
                      ) : (
                        <span className="product-placeholder"><i className="bi bi-capsule" /></span>
                      )}
                    </div>
                    <div className="product-meta">
                      <span className="product-name">{producto.nombre}</span>
                      <small>{producto.codigo} · {producto.detalle}</small>
                    </div>
                  </div>
                  <span>
                    <strong>{money(producto.precio)}</strong>
                    <em>{producto.stock > 0 ? `Stock ${producto.stock}` : 'AGOTADO'}</em>
                  </span>
                </button>
              ))}
              {!visibleProducts.length && (
                <div className="empty-state py-4">No se encontraron productos con stock disponible</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <form className="panel pos-cart" id="posForm" onSubmit={handleSubmit}>
            <h2 className="h5">Detalle de venta</h2>
            <div id="stockMessage" className={message ? `alert alert-${message.type} py-2` : 'd-none'} role="alert">
              {message?.text}
            </div>

            <div id="cartItems" className="cart-items">
              {!cart.length && <div className="empty-state">Selecciona productos para comenzar</div>}
              {cart.map((item) => (
                <div className="cart-row" key={item.id}>
                  <div>
                    <strong>{item.nombre}</strong>
                    <small>{money(item.precio)} · disponible {item.stock}</small>
                  </div>
                  <input
                    className="form-control form-control-sm"
                    aria-label={`Cantidad de ${item.nombre}`}
                    type="number"
                    min="1"
                    max={item.stock}
                    value={item.cantidad}
                    onChange={(event) => updateQuantity(item.id, event.target.value)}
                  />
                  <strong className="line-total">{money(item.precio * item.cantidad)}</strong>
                  <button
                    type="button"
                    className="btn btn-sm text-danger"
                    aria-label={`Quitar ${item.nombre}`}
                    onClick={() => removeProduct(item.id)}
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-total">
              <span>Total</span>
              <strong id="cartTotal">{money(total)}</strong>
            </div>

            <div className="row g-2 mt-2">
              <div className="col-12">
                <input
                  className="form-control"
                  name="cliente_nombre"
                  maxLength="120"
                  placeholder="Cliente (opcional)"
                  value={clienteNombre}
                  onChange={(event) => setClienteNombre(event.target.value)}
                />
              </div>
              <div className="col-6">
                <input
                  className="form-control"
                  name="cliente_documento"
                  maxLength="20"
                  placeholder="Documento"
                  value={clienteDocumento}
                  onChange={(event) => setClienteDocumento(event.target.value)}
                />
              </div>
              <div className="col-6">
                <select
                  className="form-select"
                  name="metodo_pago"
                  value={metodoPago}
                  onChange={(event) => setMetodoPago(event.target.value)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="yape">Yape</option>
                  <option value="plin">Plin</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary btn-lg w-100 mt-3" id="saleSubmit" type="submit" disabled={!cart.length || submitting}>
              {submitting ? 'Verificando stock…' : 'Verificar y confirmar venta'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
