document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  document.getElementById('menuToggle')?.addEventListener('click', () => sidebar?.classList.toggle('open'));

  const confirmModalElement = document.getElementById('novaConfirmModal');
  const confirmModal = confirmModalElement ? bootstrap.Modal.getOrCreateInstance(confirmModalElement, {backdrop: 'static'}) : null;
  window.novaConfirm = ({title = 'Confirmar acción', message = '', confirmText = 'Confirmar'} = {}) => new Promise((resolve) => {
    if (!confirmModalElement || !confirmModal) { resolve(false); return; }
    let settled = false;
    document.getElementById('novaConfirmTitle').textContent = title;
    document.getElementById('novaConfirmMessage').textContent = message;
    const confirmButton = document.getElementById('novaConfirmButton');
    confirmButton.textContent = confirmText;
    const finish = (accepted) => {
      if (settled) return;
      settled = true;
      resolve(accepted);
      if (accepted) confirmModal.hide();
    };
    confirmButton.onclick = () => finish(true);
    confirmModalElement.addEventListener('hidden.bs.modal', () => finish(false), {once: true});
    confirmModal.show();
  });

  document.querySelectorAll('[data-confirm]').forEach((element) => element.addEventListener('click', async (event) => {
    event.preventDefault();
    const accepted = await window.novaConfirm({
      title: element.dataset.confirmTitle || 'Confirmar acción',
      message: element.dataset.confirm,
      confirmText: element.dataset.confirmButton || 'Sí, confirmar',
    });
    if (!accepted) return;
    const form = element.closest('form');
    if (form) form.requestSubmit(element);
    else if (element.href) window.location.assign(element.href);
  }));
  if (!window.NovaPOS) return;

  const cart = new Map();
  const form = document.getElementById('posForm');
  const grid = document.getElementById('productGrid');
  const search = document.getElementById('productSearch');
  const box = document.getElementById('cartItems');
  const input = document.getElementById('itemsInput');
  const total = document.getElementById('cartTotal');
  const submit = document.getElementById('saleSubmit');
  const message = document.getElementById('stockMessage');
  let validating = false;

  const escapeHtml = (value) => { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; };
  const showMessage = (type, text) => { message.className = `alert alert-${type} py-2`; message.textContent = text; };
  const clearMessage = () => { message.className = 'd-none'; message.textContent = ''; };

  const updateProductCard = (id, stock) => {
    grid.querySelectorAll('.product-card').forEach((button) => {
      const product = JSON.parse(button.dataset.product);
      if (product.id !== id) return;
      product.stock = stock;
      button.dataset.product = JSON.stringify(product);
      button.querySelector('em').textContent = stock > 0 ? `Stock ${stock}` : 'AGOTADO';
      button.disabled = stock <= 0;
      button.classList.toggle('product-card-disabled', stock <= 0);
    });
  };

  const render = () => {
    box.innerHTML = '';
    let sum = 0;
    if (!cart.size) box.innerHTML = '<div class="empty-state">Selecciona productos para comenzar</div>';
    cart.forEach((product) => {
      sum += product.precio * product.cantidad;
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `<div><strong>${escapeHtml(product.nombre)}</strong><small>S/ ${product.precio.toFixed(2)} · disponible ${product.stock}</small></div><input class="form-control form-control-sm" aria-label="Cantidad de ${escapeHtml(product.nombre)}" type="number" min="1" max="${product.stock}" value="${product.cantidad}"><strong class="line-total">S/ ${(product.precio * product.cantidad).toFixed(2)}</strong><button type="button" class="btn btn-sm text-danger" aria-label="Quitar ${escapeHtml(product.nombre)}"><i class="bi bi-x-lg"></i></button>`;
      row.querySelector('input').addEventListener('input', (event) => {
        const requested = parseInt(event.target.value, 10) || 1;
        product.cantidad = Math.max(1, Math.min(product.stock, requested));
        if (requested > product.stock) showMessage('warning', `Solo hay ${product.stock} unidades disponibles de ${product.nombre}.`);
        render();
      });
      row.querySelector('button').addEventListener('click', () => { cart.delete(product.id); clearMessage(); render(); });
      box.appendChild(row);
    });
    total.textContent = `S/ ${sum.toFixed(2)}`;
    input.value = JSON.stringify([...cart.values()].map((product) => ({medicamento_id: product.id, cantidad: product.cantidad})));
    submit.disabled = !cart.size || validating;
  };

  grid?.querySelectorAll('.product-card').forEach((button) => button.addEventListener('click', () => {
    const product = JSON.parse(button.dataset.product);
    if (product.stock <= 0) { showMessage('danger', `${product.nombre} está agotado y no puede venderse.`); return; }
    if (cart.has(product.id)) {
      const current = cart.get(product.id);
      if (current.cantidad >= current.stock) { showMessage('warning', `No puedes agregar más ${current.nombre}. Alcanzaste el stock disponible (${current.stock}).`); return; }
      current.cantidad++;
    } else { product.cantidad = 1; cart.set(product.id, product); }
    clearMessage(); render();
  }));

  search?.addEventListener('input', () => {
    const query = search.value.toLowerCase().trim();
    grid.querySelectorAll('.product-card').forEach((button) => { button.hidden = !button.textContent.toLowerCase().includes(query); });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!cart.size || validating) return;
    validating = true; submit.disabled = true; submit.textContent = 'Verificando stock…';
    showMessage('info', 'Consultando existencias actuales antes de confirmar…');
    try {
      const body = new URLSearchParams();
      body.set('_token', form.querySelector('[name="_token"]').value);
      body.set('items', input.value);
      const response = await fetch(form.dataset.stockUrl, {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'}, body: body.toString()});
      if (!response.ok) throw new Error('No se pudo validar el stock.');
      const result = await response.json();
      if (!result.ok) {
        const problems = [];
        result.items.forEach((item) => {
          const product = cart.get(item.medicamento_id);
          if (!product) return;
          product.stock = item.disponible;
          updateProductCard(item.medicamento_id, item.disponible);
          if (item.disponible <= 0) { cart.delete(item.medicamento_id); problems.push(`${item.nombre}: AGOTADO`); }
          else if (product.cantidad > item.disponible) { product.cantidad = item.disponible; problems.push(`${item.nombre}: solo ${item.disponible} disponibles`); }
        });
        render(); showMessage('danger', `Venta bloqueada. ${problems.join(' · ') || result.message}`); return;
      }
      clearMessage();
      const accepted = await window.novaConfirm({
        title: 'Confirmar venta',
        message: 'El stock está disponible. ¿Deseas registrar la venta y descontar las existencias?',
        confirmText: 'Sí, registrar venta',
      });
      if (accepted) { HTMLFormElement.prototype.submit.call(form); return; }
    } catch (error) {
      showMessage('danger', 'No fue posible comprobar el stock. La venta quedó bloqueada; revisa la conexión e inténtalo nuevamente.');
    } finally {
      validating = false; submit.textContent = 'Verificar y confirmar venta'; submit.disabled = !cart.size;
    }
  });
  render();
});
