/**
 * Payroll (Nómina) — Fixed Liquidación Masiva + Historial + Comprobantes
 */
const Payroll = {
    _period: null,

    async renderPayroll() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'NÓMINA';

        const now = new Date();
        const monthName = now.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
        this._period = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

        container.innerHTML = `
            <div class="payroll-view animate-fade-in">
                <!-- Period Header -->
                <div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
                    <div>
                        <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);">Período Activo</div>
                        <div style="font-size:1.2rem;font-weight:900;color:var(--accent);text-transform:capitalize;">${monthName}</div>
                    </div>
                    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
                        <label style="cursor:pointer; display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:var(--text-muted); font-weight:600; margin-right:1rem;">
                            <input type="checkbox" id="privacy-toggle"> <span>Modo Privacidad</span>
                        </label>
                        <button class="btn btn-ghost" id="export-payroll-btn">
                            <i data-lucide="download"></i> Exportar CSV
                        </button>
                        <button class="btn btn-primary" id="process-all-btn">
                            <i data-lucide="zap"></i> Liquidación Masiva
                        </button>
                    </div>
                </div>

                <!-- Stats -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;" id="payroll-kpis"></div>

                <!-- Table -->
                <div class="card">
                    <div class="card-header">
                        <h4><i data-lucide="list"></i> Colaboradores del Período</h4>
                        <span class="badge badge-info" id="payroll-status-badge">Pendiente de Proceso</span>
                    </div>
                    <div class="data-table-container">
                        <table class="data-table" id="payroll-main-table">
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>Cargo</th>
                                    <th>Departamento</th>
                                    <th>Salario Base</th>
                                    <th>Aux. Transporte</th>
                                    <th>Deducciones</th>
                                    <th>Neto a Pagar</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="payroll-list"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('process-all-btn').addEventListener('click', () => this.processAll());
        document.getElementById('export-payroll-btn').addEventListener('click', () => this.exportCSV());
        document.getElementById('privacy-toggle').addEventListener('change', (e) => {
            const table = document.getElementById('payroll-main-table');
            if (e.target.checked) table.classList.add('privacy-blur');
            else table.classList.remove('privacy-blur');
        });

        await this.loadEmployeePayroll();
    },

    async loadEmployeePayroll() {
        UI.setLoading(true);
        const employees = await API.getEmployees();
        const config    = await API.getSystemConfig();
        UI.setLoading(false);

        const tbody = document.getElementById('payroll-list');
        if (!tbody) return;

        if (!employees.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Sin colaboradores vinculados</td></tr>';
            return;
        }

        const minSal = config?.payroll?.minSalary || 1300000;
        const transport = config?.payroll?.transportAllowance || 162000;

        let totalNeto = 0, totalDeducciones = 0;

        const rows = employees.map(e => {
            const base = e.salary || 0;
            const auxT = base <= (minSal * 2) ? transport : 0;
            const health = Math.round(base * 0.04);
            const pension = Math.round(base * 0.04);
            const dedTotal = health + pension;
            const neto = base + auxT - dedTotal;
            totalNeto += neto;
            totalDeducciones += dedTotal;

            return { e, base, auxT, dedTotal, neto };
        });

        // KPIs
        const kpis = document.getElementById('payroll-kpis');
        if (kpis) {
            kpis.innerHTML = `
                <div class="stat-glass-card">
                    <div class="stat-icon-box"><i data-lucide="users"></i></div>
                    <div class="stat-data"><h3>${employees.length}</h3><label>Colaboradores</label></div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-icon-box"><i data-lucide="banknote"></i></div>
                    <div class="stat-data"><h3>$${Math.round(totalNeto).toLocaleString()}</h3><label>Total Neto a Pagar</label></div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-icon-box" style="background:rgba(255,0,85,0.1);border-color:rgba(255,0,85,0.3);">
                        <i data-lucide="minus-circle" style="color:var(--danger);"></i>
                    </div>
                    <div class="stat-data"><h3>$${Math.round(totalDeducciones).toLocaleString()}</h3><label>Total Deducciones</label></div>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        tbody.innerHTML = rows.map(({ e, base, auxT, dedTotal, neto }) => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <div style="width:32px;height:32px;background:var(--accent-dim);border:1px solid var(--border-color);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--accent);font-size:0.82rem;flex-shrink:0;">
                            ${(e.name||'?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight:700;">${e.name}</div>
                            <div style="font-size:0.7rem;color:var(--text-muted);">${e.joinDate || ''}</div>
                        </div>
                    </div>
                </td>
                <td>${e.role || '—'}</td>
                <td>${e.department || '—'}</td>
                <td>$${base.toLocaleString()}</td>
                <td style="color:var(--success);">$${auxT.toLocaleString()}</td>
                <td style="color:var(--danger);">-$${dedTotal.toLocaleString()}</td>
                <td style="color:var(--accent);font-weight:900;font-size:1rem;">$${Math.round(neto).toLocaleString()}</td>
                <td><span class="badge badge-pending">PENDIENTE</span></td>
                <td>
                    <button class="btn btn-ghost btn-sm" onclick="Payroll.showReceipt(${e.id})">
                        <i data-lucide="file-text"></i> Comprobante
                    </button>
                </td>
            </tr>
        `).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
        this._rows = rows;
        this._employees = employees;
    },

    async processAll() {
        const ok = await UI.confirm(
            '¿Ejecutar Liquidación Masiva?',
            `Se calcularán y registrarán los comprobantes de ${(this._employees || []).length} colaboradores para el período actual.`,
            'Procesar Nómina'
        );
        if (!ok) return;

        UI.setLoading(true);

        // Mark all as paid in audit
        for (const { e } of (this._rows || [])) {
            await API.logAction('NÓMINA', `Nómina liquidada para ${e.name}`);
        }

        UI.setLoading(false);

        // Update badge
        const badge = document.getElementById('payroll-status-badge');
        if (badge) { badge.className = 'badge badge-success'; badge.textContent = 'PROCESADA'; }

        // Mark rows as paid
        document.querySelectorAll('#payroll-list tr').forEach(row => {
            const badges = row.querySelectorAll('.badge-pending');
            badges.forEach(b => { b.className = 'badge badge-success'; b.textContent = 'PAGADO'; });
        });

        Swal.fire({
            title: '¡Nómina Procesada!',
            html: `<b style="color:#00ff9d;font-size:1.3rem;">${(this._employees || []).length}</b> colaboradores liquidados correctamente.<br>Período: ${this._period}`,
            icon: 'success',
            background: '#0d0f14', color: '#f0f4f8', iconColor: '#00ff9d',
            confirmButtonColor: '#00ff9d', confirmButtonText: 'Excelente',
            customClass: { popup: 'swal-cyberpunk' }
        });
    },

    async showReceipt(employeeId) {
        UI.setLoading(true);
        let data;
        try { data = await API.calculatePayroll(employeeId); }
        catch(e) { UI.showToast('Error al calcular nómina', 'error'); UI.setLoading(false); return; }
        UI.setLoading(false);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal payroll-receipt" style="max-width:580px;" id="receipt-to-print">
                <div class="receipt-header">
                    <div class="company-brand">
                        <i data-lucide="layers"></i>
                        <div>
                            <div style="font-weight:900;color:var(--accent);">SCI ERP</div>
                            <div style="font-size:0.7rem;color:var(--text-muted);">Sistemas Corporativos S.A.S.</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:800;font-size:0.9rem;">Comprobante de Pago</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);">Período: ${new Date().toLocaleDateString('es-CO', {month:'long',year:'numeric'})}</div>
                    </div>
                </div>

                <div class="receipt-body">
                    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;padding:1rem;background:var(--accent-dim);border-radius:8px;border:1px solid var(--border-color);">
                        <div style="width:48px;height:48px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#000;font-size:1.2rem;">
                            ${(data.employeeName||'?').charAt(0)}
                        </div>
                        <div>
                            <div style="font-weight:900;font-size:1.05rem;">${data.employeeName}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted);">${data.role || ''} • ${data.department || ''}</div>
                        </div>
                    </div>

                    <div class="receipt-grid">
                        <div class="receipt-col">
                            <h4 style="color:var(--success);">▲ DEVENGADOS</h4>
                            <div class="receipt-row"><span>Sueldo Básico</span><span>$${(data.baseSalary||0).toLocaleString()}</span></div>
                            <div class="receipt-row"><span>Auxilio de Transporte</span><span>$${(data.transport||0).toLocaleString()}</span></div>
                            <div class="receipt-row" style="font-weight:700;border-top:1px solid var(--border-dim);padding-top:0.5rem;">
                                <span>Total Devengado</span>
                                <span style="color:var(--success);">$${((data.baseSalary||0)+(data.transport||0)).toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="receipt-col">
                            <h4 style="color:var(--danger);">▼ DEDUCCIONES</h4>
                            <div class="receipt-row"><span>Salud (4%)</span><span>-$${(data.health||0).toLocaleString()}</span></div>
                            <div class="receipt-row"><span>Pensión (4%)</span><span>-$${(data.pension||0).toLocaleString()}</span></div>
                            <div class="receipt-row" style="font-weight:700;border-top:1px solid var(--border-dim);padding-top:0.5rem;">
                                <span>Total Deducido</span>
                                <span style="color:var(--danger);">-$${((data.health||0)+(data.pension||0)).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div class="receipt-total">
                        <span>NETO A PAGAR</span>
                        <h2>$${Math.round(data.netPay||0).toLocaleString()}</h2>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
                    <button class="btn btn-primary" onclick="Payroll.printReceipt()">
                        <i data-lucide="printer"></i> Imprimir
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    printReceipt() {
        window.print();
    },

    async exportCSV() {
        if (!this._rows || !this._rows.length) {
            UI.showToast('No hay datos para exportar', 'warning');
            return;
        }

        const headers = ['Nombre','Cargo','Departamento','Salario Base','Aux. Transporte','Deducciones','Neto a Pagar'];
        const rows = this._rows.map(({ e, base, auxT, dedTotal, neto }) =>
            [e.name, e.role || '', e.department || '', base, auxT, dedTotal, Math.round(neto)].join(',')
        );

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `nomina_${this._period}.csv`;
        link.click();
        UI.showToast('CSV exportado correctamente', 'success');
    }
};

const payrollStyles = document.createElement('style');
payrollStyles.textContent = `
    .payroll-view { display: flex; flex-direction: column; gap: 1.25rem; }
    .payroll-receipt { padding: 0 !important; }
    .receipt-header { display:flex; justify-content:space-between; align-items:center; padding:1.5rem 2rem; border-bottom:1px solid var(--border-dim); }
    .company-brand { display:flex; align-items:center; gap:0.75rem; }
    .company-brand i { width:28px; height:28px; color:var(--accent); }
    .receipt-body { padding: 1.5rem 2rem; }
    .receipt-grid { display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-bottom:1.5rem; }
    .receipt-col h4 { font-size:0.72rem; letter-spacing:1px; text-transform:uppercase; padding-bottom:0.5rem; border-bottom:1px solid var(--border-dim); margin-bottom:0.75rem; }
    .receipt-row { display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.5rem; color:var(--text-secondary); }
    .receipt-total { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; background:var(--accent-dim); border-radius:8px; border:1px solid var(--border-color); }
    .receipt-total span { font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); }
    .receipt-total h2 { font-size:1.6rem; color:var(--accent); }
    @media print { .modal-overlay { background:white !important; } .btn { display:none !important; } }
    .privacy-blur td:nth-child(4), .privacy-blur td:nth-child(5), .privacy-blur td:nth-child(6), .privacy-blur td:nth-child(7) { 
        filter: blur(6px); 
        transition: filter 0.3s; 
        user-select: none;
    }
    .privacy-blur td:nth-child(4):hover, .privacy-blur td:nth-child(5):hover, .privacy-blur td:nth-child(6):hover, .privacy-blur td:nth-child(7):hover { 
        filter: blur(0); 
    }
`;
document.head.appendChild(payrollStyles);
window.Payroll = Payroll;

