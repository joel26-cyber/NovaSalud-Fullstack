import 'dotenv/config';
import { env } from '../src/config/env.js';

const baseUrl = process.env.API_URL || `http://localhost:${env.port}/api`;
let token = '';
let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`[OK] ${name}`);
  } else {
    failed += 1;
    console.log(`[FALLO] ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  return response;
}

async function main() {
  const health = await request('/health');
  check('GET /health responde 200', health.status === 200, `status ${health.status}`);

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario: env.admin.usuario, password: env.admin.password }),
  });
  const loginData = await login.json().catch(() => ({}));
  check('POST /auth/login con administrador', login.status === 200 && Boolean(loginData.token), loginData.message || '');
  token = loginData.token || '';

  const endpoints = [
    ['/auth/me', 'GET /auth/me'],
    ['/dashboard', 'GET /dashboard'],
    ['/medicamentos', 'GET /medicamentos'],
    ['/medicamentos/categorias', 'GET /medicamentos/categorias'],
    ['/lotes', 'GET /lotes'],
    ['/lotes/vencimientos', 'GET /lotes/vencimientos'],
    ['/inventario', 'GET /inventario'],
    ['/inventario/lotes', 'GET /inventario/lotes'],
    ['/ventas/productos', 'GET /ventas/productos'],
    ['/ventas', 'GET /ventas'],
    ['/reportes', 'GET /reportes'],
    ['/usuarios', 'GET /usuarios'],
  ];

  for (const [path, name] of endpoints) {
    const response = await request(path);
    check(name, response.status === 200, `status ${response.status}`);
  }

  const productsResponse = await request('/ventas/productos');
  const productsData = await productsResponse.json();
  const firstProduct = productsData.productos?.[0];
  if (firstProduct) {
    const stockCheck = await request('/ventas/stock-check', {
      method: 'POST',
      body: JSON.stringify({ items: [{ medicamento_id: firstProduct.id, cantidad: 1 }] }),
    });
    const stockData = await stockCheck.json();
    check('POST /ventas/stock-check valida stock', stockCheck.status === 200 && typeof stockData.ok === 'boolean', stockData.message || '');
  }

  const pdf = await request('/reportes/pdf?tipo=stock');
  check('GET /reportes/pdf devuelve PDF', pdf.status === 200 && pdf.headers.get('content-type')?.includes('application/pdf'), `status ${pdf.status}`);
  const csv = await request('/reportes/csv?tipo=ventas');
  check('GET /reportes/csv devuelve CSV', csv.status === 200 && csv.headers.get('content-type')?.includes('text/csv'), `status ${csv.status}`);

  console.log(`\nResultado: ${passed} aprobadas, ${failed} fallidas.`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error('No se pudo ejecutar la prueba. ¿Está el backend iniciado?');
  console.error(error.message);
  process.exit(1);
});
