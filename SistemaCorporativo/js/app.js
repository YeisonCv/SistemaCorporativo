const App = {
    async init() {
        console.log('App initialization (Cloud Mode)...');
        
        console.group('%c🔐 Credenciales de Prueba (SCI ERP)', 'color: #3B82F6; font-size: 14px; font-weight: bold;');
        console.log('%cAdmin: %c admin@sci-erp.com      %c/ admin123', 'color: #9CA3AF', 'color: #F9FAFB; font-weight: bold;', 'color: #6B7280');
        console.log('%cInventario: %c inventario@sci-erp.com %c/ inv123', 'color: #9CA3AF', 'color: #F9FAFB; font-weight: bold;', 'color: #6B7280');
        console.log('%cVentas: %c ventas@sci-erp.com     %c/ ven123', 'color: #9CA3AF', 'color: #F9FAFB; font-weight: bold;', 'color: #6B7280');
        console.log('%cRRHH: %c rrhh@sci-erp.com       %c/ rrhh123', 'color: #9CA3AF', 'color: #F9FAFB; font-weight: bold;', 'color: #6B7280');
        console.groupEnd();

        // Initialize Theme
        this.initTheme();

        // Initialize Store (Migration + Connection)
        await Store.init();

        // Define Routes
        const routes = {
            '#/login': () => Auth.renderLogin(),
            '#/logout': () => Auth.handleLogout(),
            '#/dashboard': () => this.renderDashboard(),
            '#/existencias': () => Inventory.renderList(),
            '#/movimientos': () => Inventory.renderMovements(),
            '#/ventas': () => Sales.renderSales(),
            '#/clientes': () => ClientsModule.renderView(),
            '#/compras': () => Purchases.renderPurchases(),
            '#/proveedores': () => Suppliers.renderView(),
            '#/rrhh': () => HR.renderEmployees(),
            '#/nomina': () => Payroll.renderPayroll(),
            '#/social': () => SocialSecurity.renderView(),
            '#/novedades': () => Absences.renderView(),
            '#/reportes': () => Analytics.renderView(),
            '#/configuracion': () => System.renderView(),
            '#/perfil': () => ProfileView.renderView()
        };

        // Initialize Router
        Router.init(routes);

        // Set User Info in UI
        const user = await API.getCurrentUser();
        if (user) {
            document.getElementById('user-name').innerText = user.name;
        }

        // Global Event Listeners
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.handleLogout();
        });

        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Initialize Lucide Icons
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    initTheme() {
        const saved = localStorage.getItem('sci_theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', saved);
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next    = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('sci_theme', next);
        UI.showToast(`Modo ${next === 'dark' ? 'Oscuro' : 'Claro'} activado`, 'success');
    },

    async renderDashboard() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'Panel de Control Corporativo';

        UI.setLoading(true);
        const products = await API.getProducts();
        const sales = await API.getSales();
        const warehouses = await API.getWarehouses();
        const employees = await API.getEmployees();
        UI.setLoading(false);

        const totalSales = sales.reduce((acc, s) => acc + s.total, 0);

        container.innerHTML = `
            <div class="dashboard-grid animate-fade-in">
                <!-- Quick Stats Section -->
                <div class="quick-stats">
                    <div class="stat-glass-card glass interactive-scale">
                        <div class="stat-icon-box"><i data-lucide="home"></i></div>
                        <div class="stat-data">
                            <h3>${warehouses.length || 0}</h3>
                            <label>Bodegas Activas</label>
                        </div>
                    </div>

                    <div class="stat-glass-card glass interactive-scale">
                        <div class="stat-icon-box" style="background:rgba(0, 212, 255, 0.1); border-color: rgba(0, 212, 255, 0.3);">
                            <i data-lucide="alert-triangle" style="color: var(--info);"></i>
                        </div>
                        <div class="stat-data">
                            <h3 style="color:var(--info);">${products.filter(p => p.stock <= (p.minStock || 5)).length}</h3>
                            <label>Stock Bajo/Agotado</label>
                        </div>
                    </div>

                    <div class="stat-glass-card glass interactive-scale">
                        <div class="stat-icon-box"><i data-lucide="dollar-sign"></i></div>
                        <div class="stat-data">
                            <h3>$${totalSales.toLocaleString()}</h3>
                            <label>Total Ventas</label>
                        </div>
                    </div>

                    <div class="stat-glass-card glass interactive-scale">
                        <div class="stat-icon-box"><i data-lucide="users"></i></div>
                        <div class="stat-data">
                            <h3>${employees.length || 0}</h3>
                            <label>Total Empleados</label>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Access Shortcuts -->
                <div class="card glass text-center" style="padding:1rem;">
                    <div style="display:flex; justify-content:center; gap: 1rem; flex-wrap:wrap;">
                        <button class="btn btn-primary" onclick="window.location.hash='#/ventas'"><i data-lucide="shopping-cart"></i> Nueva Venta</button>
                        <button class="btn btn-ghost" onclick="window.location.hash='#/clientes'"><i data-lucide="user-plus"></i> Añadir Cliente</button>
                        <button class="btn btn-ghost" onclick="window.location.hash='#/compras'"><i data-lucide="truck"></i> Crear Orden de Compra</button>
                        <button class="btn btn-ghost" onclick="window.location.hash='#/nomina'"><i data-lucide="calculator"></i> Liquidar Nómina</button>
                    </div>
                </div>

                <!-- Recent Activity Table -->
                <div class="card glass bento-main animate-slide-up">
                    <div class="card-header">
                        <h4>Actividad Reciente</h4>
                    </div>
                    <div class="data-table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>FECHA</th>
                                    <th>TIPO</th>
                                    <th>REFERENCIA</th>
                                    <th>DETALLES</th>
                                </tr>
                            </thead>
                            <tbody id="dashboard-audit-log">
                                <!-- Loaded from Audit Log -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Load real audit logs to dashboard
        const logs = await API.getAuditLogs();
        const logTable = document.getElementById('dashboard-audit-log');
        logTable.innerHTML = logs.slice(0, 5).map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
                <td><span class="badge badge-info">${log.action}</span></td>
                <td>${log.user}</td>
                <td>${log.details}</td>
            </tr>
        `).join('') || '<tr><td colspan="4" style="text-align:center">Sin actividad reciente</td></tr>';

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderPlaceholder(title) {
        document.getElementById('page-title').innerText = title;
        document.getElementById('view-content').innerHTML = `
            <div class="placeholder-view animate-fade-in">
                <i data-lucide="construction" class="huge-icon" style="width: 80px; height: 80px; opacity: 0.1; margin-bottom: 2rem;"></i>
                <h2>Módulo en Desarrollo</h2>
                <p>El módulo de ${title} estará disponible próximamente.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

window.addEventListener('DOMContentLoaded', () => App.init());
