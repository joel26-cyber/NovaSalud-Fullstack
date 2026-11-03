<div class="page-heading mb-3">
  <div>
    <h1>Dashboard</h1>
    <p>Monitoreo farmacéutico y comercial en tiempo real · <?=date('d/m/Y')?></p>
  </div>
  <a class="btn btn-primary" href="<?=url('index.php?page=ventas')?>">
    <i class="bi bi-cart-plus me-1"></i> Punto de venta
  </a>
</div>

<!-- KPIs Rápidos Compactos -->
<div class="row g-2 mb-3 dashboard-kpi-row">
  <?php 
  $cards = [
    ['Medicamentos', $stats['medicamentos'], 'bi-capsule', 'primary'],
    ['Stock disponible', $stats['stock'], 'bi-box-seam', 'success'],
    ['Ventas de hoy', $stats['ventas'], 'bi-receipt', 'info'],
    ['Ingresos hoy', money($stats['ingresos']), 'bi-cash-stack', 'danger'],
    ['Próx. a vencer', $stats['proximos'], 'bi-clock-history', 'warning'],
    ['Lotes vencidos', $stats['vencidos'], 'bi-exclamation-octagon', 'danger']
  ];
  foreach($cards as $c): 
  ?>
    <div class="col-6 col-md-4 col-xl-2">
      <div class="stat-card compact-stat">
        <div class="stat-icon stat-icon-sm bg-<?=$c[3]?>-subtle text-<?=$c[3]?>">
          <i class="bi <?=$c[2]?>"></i>
        </div>
        <div class="stat-content">
          <small><?=$c[0]?></small>
          <strong><?=$c[1]?></strong>
        </div>
      </div>
    </div>
  <?php endforeach ?>
</div>

<!-- Fila de los 2 Gráficos (Ajustados para no desbordar pantalla) -->
<div class="row g-3 mb-3">
  <div class="col-xl-7">
    <div class="panel dashboard-card">
      <div class="panel-title mb-2 pb-1">
        <h2><i class="bi bi-graph-up-arrow me-2 text-danger"></i>Tendencia de Ventas (Últimos 7 días)</h2>
        <span class="badge text-bg-light border text-muted">Ingresos S/</span>
      </div>
      <div class="chart-container" style="position: relative; height: 165px; width: 100%;">
        <canvas id="chartVentas"></canvas>
      </div>
    </div>
  </div>

  <div class="col-xl-5">
    <div class="panel dashboard-card">
      <div class="panel-title mb-2 pb-1">
        <h2><i class="bi bi-pie-chart-fill me-2 text-danger"></i>Stock por Categoría</h2>
        <span class="badge text-bg-light border text-muted">Top existencias</span>
      </div>
      <div class="chart-container" style="position: relative; height: 165px; width: 100%;">
        <canvas id="chartCategorias"></canvas>
      </div>
    </div>
  </div>
</div>

<!-- Fila de Tablas Operativas Compactas -->
<div class="row g-3">
  <div class="col-xl-6">
    <div class="panel dashboard-card dashboard-table-card">
      <div class="panel-title mb-2 pb-1">
        <h2><i class="bi bi-exclamation-triangle-fill me-2 text-warning"></i>Stock bajo y agotado</h2>
        <a href="<?=url('index.php?page=medicamentos')?>">Ver catálogo</a>
      </div>
      <div class="table-responsive dashboard-table-wrap">
        <table class="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Medicamento</th>
              <th>Disponible</th>
              <th>Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach($bajo as $r): ?>
              <tr>
                <td>
                  <strong><?=e($r['nombre'])?></strong>
                  <small class="d-block text-muted"><?=e($r['codigo'])?></small>
                </td>
                <td><?=$r['stock']?></td>
                <td><?=$r['stock_minimo']?></td>
                <td>
                  <span class="badge text-bg-<?=$r['stock']==0?'danger':'warning'?>">
                    <?=$r['stock']==0?'Agotado':'Stock bajo'?>
                  </span>
                </td>
              </tr>
            <?php endforeach ?>
            <?php if(!$bajo): ?>
              <tr><td colspan="4" class="empty-state py-3">Sin alertas de stock</td></tr>
            <?php endif ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="col-xl-6">
    <div class="panel dashboard-card dashboard-table-card">
      <div class="panel-title mb-2 pb-1">
        <h2><i class="bi bi-clock-history me-2 text-info"></i>Últimas ventas</h2>
        <a href="<?=url('index.php?page=historial')?>">Ver historial</a>
      </div>
      <div class="table-responsive dashboard-table-wrap">
        <table class="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Venta</th>
              <th>Responsable</th>
              <th>Fecha</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach($ultimas as $r): ?>
              <tr>
                <td><a href="<?=url('index.php?page=venta&id='.$r['id'])?>"><?=e($r['numero'])?></a></td>
                <td><?=e($r['nombres'])?></td>
                <td><?=date('d/m H:i', strtotime($r['creado_en']))?></td>
                <td class="fw-bold"><?=money($r['total'])?></td>
              </tr>
            <?php endforeach ?>
            <?php if(!$ultimas): ?>
              <tr><td colspan="4" class="empty-state py-3">Aún no hay ventas</td></tr>
            <?php endif ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  if (typeof Chart === 'undefined') return;

  const labelsVentas = <?=json_encode($chartVentas['labels'], JSON_UNESCAPED_UNICODE)?>;
  const dataIngresos = <?=json_encode($chartVentas['ingresos'])?>;
  const dataCantVentas = <?=json_encode($chartVentas['ventas'])?>;

  const ctxV = document.getElementById('chartVentas');
  if (ctxV) {
    const ctx = ctxV.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 150);
    grad.addColorStop(0, 'rgba(230, 57, 70, 0.35)');
    grad.addColorStop(1, 'rgba(230, 57, 70, 0.00)');

    new Chart(ctxV, {
      type: 'line',
      data: {
        labels: labelsVentas,
        datasets: [{
          label: 'Ingresos (S/)',
          data: dataIngresos,
          borderColor: '#e63946',
          borderWidth: 2.5,
          backgroundColor: grad,
          fill: true,
          tension: 0.38,
          pointBackgroundColor: '#e63946',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
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
              label: function(c) {
                const idx = c.dataIndex;
                return ' S/ ' + parseFloat(c.raw).toFixed(2) + ' (' + (dataCantVentas[idx] || 0) + ' ventas)';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#64748b' }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.8)' },
            ticks: {
              font: { size: 10 },
              color: '#64748b',
              callback: function(v) { return 'S/' + v; }
            }
          }
        }
      }
    });
  }

  const labelsCat = <?=json_encode($chartCategorias['labels'], JSON_UNESCAPED_UNICODE)?>;
  const dataCat = <?=json_encode($chartCategorias['stock'])?>;

  const ctxC = document.getElementById('chartCategorias');
  if (ctxC) {
    new Chart(ctxC, {
      type: 'doughnut',
      data: {
        labels: labelsCat.length ? labelsCat : ['Sin datos'],
        datasets: [{
          data: dataCat.length ? dataCat : [1],
          backgroundColor: [
            '#e63946',
            '#00c49f',
            '#0ea5e9',
            '#f59e0b',
            '#8b5cf6'
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
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
              color: '#334155'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 8,
            callbacks: {
              label: function(c) {
                return ' ' + c.label + ': ' + c.raw + ' unids.';
              }
            }
          }
        }
      }
    });
  }
});
</script>
