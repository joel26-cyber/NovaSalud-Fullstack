import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Line } from 'react-chartjs-2';
import { api, apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageLoader from '../components/PageLoader';
import { isoToDisplayDateTime, money, number, todayIso } from '../utils/format';
import '../lib/charts';

export default function Dashboard() {
  const { notify } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/dashboard')
      .then(({ data: payload }) => {
        if (active) setData(payload);
      })
      .catch((error) => {
        if (active) notify('danger', apiErrorMessage(error, 'No se pudo cargar el dashboard.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [notify]);

  if (loading) return <PageLoader text="Cargando indicadores..." />;
  if (!data) return null;

  const cards = [
    { label: 'Medicamentos', value: number(data.stats.medicamentos), icon: 'bi-capsule', color: 'primary' },
    { label: 'Stock disponible', value: number(data.stats.stock), icon: 'bi-box-seam', color: 'success' },
    { label: 'Ventas de hoy', value: number(data.stats.ventas), icon: 'bi-receipt', color: 'info' },
    { label: 'Ingresos hoy', value: money(data.stats.ingresos), icon: 'bi-cash-stack', color: 'danger' },
    { label: 'Próx. a vencer', value: number(data.stats.proximos), icon: 'bi-clock-history', color: 'warning' },
    { label: 'Lotes vencidos', value: number(data.stats.vencidos), icon: 'bi-exclamation-octagon', color: 'danger' },
  ];

  const lineData = {
    labels: data.chartVentas.labels,
    datasets: [{
      label: 'Ingresos (S/)',
      data: data.chartVentas.ingresos,
      borderColor: '#e63946',
      borderWidth: 2.5,
      backgroundColor: (context) => {
        const { chart } = context;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(230, 57, 70, 0.08)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(230, 57, 70, 0.35)');
        gradient.addColorStop(1, 'rgba(230, 57, 70, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.38,
      pointBackgroundColor: '#e63946',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 8,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        callbacks: {
          label: (context) => {
            const sales = data.chartVentas.ventas[context.dataIndex] || 0;
            return ` S/ ${Number(context.raw).toFixed(2)} (${sales} ventas)`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.8)' },
        ticks: {
          font: { size: 10 },
          color: '#64748b',
          callback: (value) => `S/${value}`,
        },
      },
    },
  };

  const doughnutData = {
    labels: data.chartCategorias.labels.length ? data.chartCategorias.labels : ['Sin datos'],
    datasets: [{
      data: data.chartCategorias.stock.length ? data.chartCategorias.stock : [1],
      backgroundColor: ['#e63946', '#00c49f', '#0ea5e9', '#f59e0b', '#8b5cf6'],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 4,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 11, family: 'Plus Jakarta Sans' },
          color: '#334155',
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 8,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} unids.`,
        },
      },
    },
  };

  return (
    <>
      <div className="page-heading mb-3">
        <div>
          <h1>Dashboard</h1>
          <p>Monitoreo farmacéutico y comercial en tiempo real · {isoToDisplayDateTime(todayIso())}</p>
        </div>
        <Link className="btn btn-primary" to="/ventas">
          <i className="bi bi-cart-plus me-1" /> Punto de venta
        </Link>
      </div>

      <div className="row g-2 mb-3 dashboard-kpi-row">
        {cards.map((card) => (
          <div className="col-6 col-md-4 col-xl-2" key={card.label}>
            <div className="stat-card compact-stat">
              <div className={`stat-icon stat-icon-sm bg-${card.color}-subtle text-${card.color}`}>
                <i className={`bi ${card.icon}`} />
              </div>
              <div className="stat-content">
                <small>{card.label}</small>
                <strong>{card.value}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-xl-7">
          <div className="panel dashboard-card">
            <div className="panel-title mb-2 pb-1">
              <h2><i className="bi bi-graph-up-arrow me-2 text-danger" />Tendencia de Ventas (Últimos 7 días)</h2>
              <span className="badge text-bg-light border text-muted">Ingresos S/</span>
            </div>
            <div className="chart-container" style={{ position: 'relative', height: 165, width: '100%' }}>
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="panel dashboard-card">
            <div className="panel-title mb-2 pb-1">
              <h2><i className="bi bi-pie-chart-fill me-2 text-danger" />Stock por Categoría</h2>
              <span className="badge text-bg-light border text-muted">Top existencias</span>
            </div>
            <div className="chart-container" style={{ position: 'relative', height: 165, width: '100%' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-xl-6">
          <div className="panel dashboard-card dashboard-table-card">
            <div className="panel-title mb-2 pb-1">
              <h2><i className="bi bi-exclamation-triangle-fill me-2 text-warning" />Stock bajo y agotado</h2>
              <Link to="/medicamentos">Ver catálogo</Link>
            </div>
            <div className="table-responsive dashboard-table-wrap">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Medicamento</th>
                    <th>Disponible</th>
                    <th>Mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bajo.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.nombre}</strong>
                        <small className="d-block text-muted">{row.codigo}</small>
                      </td>
                      <td>{row.stock}</td>
                      <td>{row.stock_minimo}</td>
                      <td>
                        <span className={`badge text-bg-${Number(row.stock) === 0 ? 'danger' : 'warning'}`}>
                          {Number(row.stock) === 0 ? 'Agotado' : 'Stock bajo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!data.bajo.length && (
                    <tr><td colSpan="4" className="empty-state py-3">Sin alertas de stock</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="panel dashboard-card dashboard-table-card">
            <div className="panel-title mb-2 pb-1">
              <h2><i className="bi bi-clock-history me-2 text-info" />Últimas ventas</h2>
              <Link to="/historial">Ver historial</Link>
            </div>
            <div className="table-responsive dashboard-table-wrap">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Venta</th>
                    <th>Responsable</th>
                    <th>Fecha</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ultimas.map((row) => (
                    <tr key={row.id}>
                      <td><Link to={`/ventas/${row.id}`}>{row.numero}</Link></td>
                      <td>{row.nombres}</td>
                      <td>{isoToDisplayDateTime(row.creado_en)}</td>
                      <td className="fw-bold">{money(row.total)}</td>
                    </tr>
                  ))}
                  {!data.ultimas.length && (
                    <tr><td colSpan="4" className="empty-state py-3">Aún no hay ventas</td></tr>
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
