/**
 * Analytics / BI Module — Chart.js powered real-time charts
 */
const Analytics = {
    _charts: {},

    async renderView() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'BI & ANALÍTICA';

        container.innerHTML = `
            <div class="analytics-view animate-fade-in">
                <!-- KPI Row -->
                <div class="analytics-kpis" id="analytics-kpis"></div>

                <!-- Charts Row -->
                <div class="analytics-charts-grid">
                    <div class="card" style="grid-column: span 2;">
                        <div class="card-header">
                            <h4><i data-lucide="trending-up"></i> Histórico de Ventas</h4>
                            <span class="badge badge-success">En Vivo</span>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="chart-sales"></canvas>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h4><i data-lucide="pie-chart"></i> Stock por Categoría</h4>
                        </div>
                        <div class="chart-wrapper" style="min-height:260px;">
                            <canvas id="chart-stock"></canvas>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h4><i data-lucide="activity"></i> Movimientos (30 días)</h4>
                        </div>
                        <div class="chart-wrapper" style="min-height:260px;">
                            <canvas id="chart-movements"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Insights -->
                <div class="analytics-insights" id="analytics-insights"></div>
            </div>
        `;

        // Load data
        UI.setLoading(true);
        const [sales, products, movements, employees] = await Promise.all([
            API.getSales(), API.getProducts(), API.getMovements(), API.getEmployees()
        ]);
        UI.setLoading(false);

        this._renderKPIs(sales, products, employees);
        this._renderSalesChart(sales);
        this._renderStockChart(products);
        this._renderMovementsChart(movements);
        this._renderInsights(products, sales);

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _renderKPIs(sales, products, employees) {
        const el = document.getElementById('analytics-kpis');
        if (!el) return;
        const totalRevenue = sales.reduce((s, x) => s + (x.total || 0), 0);
        const totalProducts = products.length;
        const lowStock = products.filter(p => p.stock <= (p.minStock || 5)).length;
        const totalEmp = employees.length;

        el.innerHTML = `
            <div class="stat-glass-card">
                <div class="stat-icon-box"><i data-lucide="dollar-sign"></i></div>
                <div class="stat-data">
                    <h3>$${Math.round(totalRevenue).toLocaleString()}</h3>
                    <label>Ingresos Totales</label>
                </div>
            </div>
            <div class="stat-glass-card">
                <div class="stat-icon-box"><i data-lucide="package"></i></div>
                <div class="stat-data">
                    <h3>${totalProducts}</h3>
                    <label>SKUs Activos</label>
                </div>
            </div>
            <div class="stat-glass-card">
                <div class="stat-icon-box" style="background:rgba(255,0,85,0.1);border-color:rgba(255,0,85,0.3);">
                    <i data-lucide="alert-triangle" style="color:var(--danger);"></i>
                </div>
                <div class="stat-data">
                    <h3 style="color:var(--danger);">${lowStock}</h3>
                    <label>Stock Bajo</label>
                </div>
            </div>
            <div class="stat-glass-card">
                <div class="stat-icon-box"><i data-lucide="users"></i></div>
                <div class="stat-data">
                    <h3>${totalEmp}</h3>
                    <label>Colaboradores</label>
                </div>
            </div>
        `;
    },

    _chartDefaults() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return {
            gridColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            textColor: isDark ? '#8899a6' : '#4a5568',
            accent: '#00ff9d',
            accent2: '#00d4ff',
            accent3: '#ff0055',
            accent4: '#ffcc00',
        };
    },

    _renderSalesChart(sales) {
        const ctx = document.getElementById('chart-sales');
        if (!ctx) return;
        const d = this._chartDefaults();

        // Group sales by date
        const byDate = {};
        sales.forEach(s => {
            const day = new Date(s.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
            byDate[day] = (byDate[day] || 0) + (s.total || 0);
        });

        const labels = Object.keys(byDate).slice(-10);
        const data   = labels.map(l => byDate[l]);

        if (this._charts.sales) this._charts.sales.destroy();
        this._charts.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.length ? labels : ['Sin datos'],
                datasets: [{
                    label: 'Ventas ($)',
                    data: data.length ? data : [0],
                    borderColor: d.accent,
                    backgroundColor: (ctx2) => {
                        const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 200);
                        g.addColorStop(0, 'rgba(0,255,157,0.2)');
                        g.addColorStop(1, 'rgba(0,255,157,0)');
                        return g;
                    },
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: d.accent,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: d.textColor, font: { size: 11 } } }
                },
                scales: {
                    x: { ticks: { color: d.textColor }, grid: { color: d.gridColor } },
                    y: { ticks: { color: d.textColor, callback: v => '$' + v.toLocaleString() }, grid: { color: d.gridColor } }
                }
            }
        });
    },

    _renderStockChart(products) {
        const ctx = document.getElementById('chart-stock');
        if (!ctx) return;
        const d = this._chartDefaults();

        const cats = {};
        products.forEach(p => { cats[p.category || 'N/A'] = (cats[p.category || 'N/A'] || 0) + (p.stock || 0); });
        const labels = Object.keys(cats);
        const data   = labels.map(l => cats[l]);
        const colors = ['#00ff9d','#00d4ff','#ff0055','#ffcc00','#c084fc','#fb923c'];

        if (this._charts.stock) this._charts.stock.destroy();
        this._charts.stock = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['Sin datos'],
                datasets: [{ data: data.length ? data : [1], backgroundColor: colors, borderColor: 'transparent', hoverOffset: 8 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: d.textColor, padding: 14, font: { size: 11 } } }
                },
                cutout: '65%'
            }
        });
    },

    _renderMovementsChart(movements) {
        const ctx = document.getElementById('chart-movements');
        if (!ctx) return;
        const d = this._chartDefaults();

        const entradas = {}, salidas = {};
        movements.forEach(m => {
            const day = new Date(m.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
            if (m.type === 'ENTRADA') entradas[day] = (entradas[day] || 0) + 1;
            else salidas[day] = (salidas[day] || 0) + 1;
        });

        const allDays = [...new Set([...Object.keys(entradas), ...Object.keys(salidas)])].slice(-8);

        if (this._charts.movements) this._charts.movements.destroy();
        this._charts.movements = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allDays.length ? allDays : ['Sin datos'],
                datasets: [
                    { label: 'Entradas', data: allDays.map(d => entradas[d] || 0), backgroundColor: 'rgba(0,255,157,0.7)', borderRadius: 4 },
                    { label: 'Salidas',  data: allDays.map(d => salidas[d]  || 0), backgroundColor: 'rgba(255,0,85,0.7)',   borderRadius: 4 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: d.textColor, font: { size: 11 } } } },
                scales: {
                    x: { ticks: { color: d.textColor }, grid: { color: d.gridColor }, stacked: false },
                    y: { ticks: { color: d.textColor, stepSize: 1 }, grid: { color: d.gridColor } }
                }
            }
        });
    },

    _renderInsights(products, sales) {
        const el = document.getElementById('analytics-insights');
        if (!el) return;
        const lowStock = products.filter(p => p.stock <= (p.minStock || 5));
        const topSales = sales.sort((a,b) => (b.total||0) - (a.total||0)).slice(0, 3);

        el.innerHTML = `
            <div class="insights-grid">
                ${lowStock.length ? `
                <div class="card insight-card">
                    <div class="insight-header">
                        <i data-lucide="alert-triangle" style="color:var(--warning);"></i>
                        <h4>Alerta de Reabastecimiento</h4>
                    </div>
                    <ul class="insight-list">
                        ${lowStock.map(p => `<li><span>${p.name}</span><span class="text-danger">${p.stock} ${p.unit||'UND'}</span></li>`).join('')}
                    </ul>
                </div>` : ''}

                ${topSales.length ? `
                <div class="card insight-card">
                    <div class="insight-header">
                        <i data-lucide="trophy" style="color:var(--accent);"></i>
                        <h4>Top Ventas Recientes</h4>
                    </div>
                    <ul class="insight-list">
                        ${topSales.map(s => `<li><span>${s.id}</span><span class="text-accent">$${Math.round(s.total||0).toLocaleString()}</span></li>`).join('')}
                    </ul>
                </div>` : ''}
            </div>
        `;
    }
};

const _analyticsStyle = document.createElement('style');
_analyticsStyle.textContent = `
    .analytics-view { display: flex; flex-direction: column; gap: 1.5rem; }
    .analytics-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .analytics-charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .insight-card { padding: 1.25rem !important; }
    .insight-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .insight-header i { width: 22px; height: 22px; }
    .insight-header h4 { font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-primary); }
    .insight-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
    .insight-list li { display: flex; justify-content: space-between; font-size: 0.82rem; padding: 0.4rem 0; border-bottom: 1px solid var(--border-dim); }
`;
document.head.appendChild(_analyticsStyle);
window.Analytics = Analytics;
