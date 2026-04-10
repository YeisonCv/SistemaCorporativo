/**
 * SocialSecurity Module - Liquidación de Aportes
 */
const SocialSecurity = {
    async renderView() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'SEGURIDAD SOCIAL';

        container.innerHTML = `
            <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:1.25rem;">
                <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);">Período de Aportes</div>
                        <div style="font-size:1.2rem;font-weight:900;color:var(--accent);text-transform:capitalize;">${new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' })}</div>
                    </div>
                    <button class="btn btn-primary" id="calculate-ss-btn">
                        <i data-lucide="calculator"></i> Calcular Planilla PILA
                    </button>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;" id="ss-kpis"></div>

                <div class="card">
                    <div class="card-header">
                        <h4><i data-lucide="shield-check"></i> Aportes por Colaborador</h4>
                    </div>
                    <div class="data-table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>IBC (Ingreso Base)</th>
                                    <th>Empresa (Salud/Pensión/Riesgos)</th>
                                    <th>Parafiscales (SENA/ICBF/CCF)</th>
                                    <th>Total Aportes</th>
                                </tr>
                            </thead>
                            <tbody id="ss-list">
                                <tr><td colspan="5" class="empty-state">Clic en "Calcular Planilla PILA" para generar aportes</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('calculate-ss-btn').addEventListener('click', () => this.calculatePILA());
    },

    async calculatePILA() {
        UI.setLoading(true);
        const employees = await API.getEmployees();
        UI.setLoading(false);

        const tbody = document.getElementById('ss-list');
        const kpis = document.getElementById('ss-kpis');
        if (!tbody || !kpis) return;

        if (!employees.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay trabajadores para calcular</td></tr>';
            return;
        }

        let totalIBC = 0;
        let totalEmpresa = 0;
        let totalParafiscales = 0;

        const rows = employees.map(e => {
            const ibc = e.salary || 0; // Simplified IBC
            
            // Empresa: Salud 8.5%, Pensión 12%, ARL 0.522%
            const saludEmp = ibc * 0.085;
            const pensionEmp = ibc * 0.12;
            const arlEmp = ibc * 0.00522;
            const empresaTotal = saludEmp + pensionEmp + arlEmp;

            // Parafiscales: SENA 2%, ICBF 3%, CCF 4%
            const sena = ibc * 0.02;
            const icbf = ibc * 0.03;
            const ccf = ibc * 0.04;
            const parafiscalesTotal = sena + icbf + ccf;

            const total = empresaTotal + parafiscalesTotal;

            totalIBC += ibc;
            totalEmpresa += empresaTotal;
            totalParafiscales += parafiscalesTotal;

            return `
                <tr>
                    <td style="font-weight:700;">${e.name}</td>
                    <td>$${ibc.toLocaleString()}</td>
                    <td style="color:var(--info);">$${Math.round(empresaTotal).toLocaleString()}</td>
                    <td style="color:var(--warning);">$${Math.round(parafiscalesTotal).toLocaleString()}</td>
                    <td style="color:var(--accent);font-weight:900;">$${Math.round(total).toLocaleString()}</td>
                </tr>
            `;
        });

        tbody.innerHTML = rows.join('');

        kpis.innerHTML = `
            <div class="stat-glass-card">
                <div class="stat-icon-box"><i data-lucide="activity"></i></div>
                <div class="stat-data"><h3>$${Math.round(totalIBC).toLocaleString()}</h3><label>IBC Total</label></div>
            </div>
            <div class="stat-glass-card">
                <div class="stat-icon-box"><i data-lucide="building"></i></div>
                <div class="stat-data"><h3 style="color:var(--info);">$${Math.round(totalEmpresa).toLocaleString()}</h3><label>Aportes Patronales</label></div>
            </div>
            <div class="stat-glass-card">
                <div class="stat-icon-box"><i data-lucide="users"></i></div>
                <div class="stat-data"><h3 style="color:var(--warning);">$${Math.round(totalParafiscales).toLocaleString()}</h3><label>Total Parafiscales</label></div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        UI.showToast('Planilla PILA calculada correctamente', 'success');
    }
};
window.SocialSecurity = SocialSecurity;
