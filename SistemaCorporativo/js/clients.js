/**
 * Clients Module - Complete CRM for Clients
 */
const ClientsModule = {
    async renderView() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'DIRECTORIO DE CLIENTES';

        container.innerHTML = `
            <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:1.25rem;">
                <div class="view-actions">
                    <div class="search-box">
                        <i data-lucide="search"></i>
                        <input type="text" placeholder="Buscar cliente por nombre o NIT..." id="cli-search">
                    </div>
                    <button class="btn btn-primary" id="add-client-btn">
                        <i data-lucide="user-plus"></i> Nuevo Cliente
                    </button>
                </div>

                <!-- KPI strip -->
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;" id="cli-kpis"></div>

                <div class="card">
                    <div id="clients-table-container"></div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('add-client-btn').addEventListener('click', () => this.renderModal());
        document.getElementById('cli-search').addEventListener('input', e => this._render(e.target.value));

        await this._loadAll();
    },

    async _loadAll(filter = '') {
        UI.setLoading(true);
        const clients = await API.getClients();
        const sales = await API.getSales();
        UI.setLoading(false);

        // KPIs
        const kpis = document.getElementById('cli-kpis');
        if (kpis) {
            const totalRevenue = sales.reduce((a, s) => a + (s.total || 0), 0);
            kpis.innerHTML = `
                <div class="stat-glass-card">
                    <div class="stat-icon-box"><i data-lucide="users"></i></div>
                    <div class="stat-data"><h3>${clients.length}</h3><label>Clientes Registrados</label></div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-icon-box"><i data-lucide="shopping-cart"></i></div>
                    <div class="stat-data"><h3>${sales.length}</h3><label>Ventas Totales</label></div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-icon-box"><i data-lucide="dollar-sign"></i></div>
                    <div class="stat-data"><h3>$${Math.round(totalRevenue).toLocaleString()}</h3><label>Ingreso Histórico</label></div>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        this._clients = clients;
        this._sales = sales;
        this._render(filter);
    },

    _render(filter = '') {
        const term = filter.toLowerCase().trim();
        const filtered = (this._clients || []).filter(c =>
            (c.name || '').toLowerCase().includes(term) ||
            (c.nit  || '').toLowerCase().includes(term) ||
            (c.contact || '').toLowerCase().includes(term)
        );

        const c = document.getElementById('clients-table-container');
        if (!c) return;

        if (!filtered.length) {
            c.innerHTML = '<div class="empty-state">[ Sin clientes registrados — Añade uno nuevo ]</div>';
            return;
        }

        c.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>NIT/CC</th>
                        <th>Contacto Principal</th>
                        <th>Teléfono</th>
                        <th>Ubicación</th>
                        <th>Historial Ventas</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(c => {
                        const clientSales = (this._sales || []).filter(s => 
                            (s.client || '').toLowerCase() === (c.name || '').toLowerCase() || 
                            String(s.clientId) === String(c.id)
                        );
                        const totalSpent = clientSales.reduce((a, s) => a + (s.total || 0), 0);
                        return `
                            <tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:0.75rem;">
                                        <div style="width:34px;height:34px;background:rgba(0,135,90,0.1);border:1px solid var(--border-color);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--accent);font-size:0.85rem;flex-shrink:0;">
                                            ${(c.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style="font-weight:700;">${c.name || '—'}</div>
                                            <div style="font-size:0.7rem;color:var(--text-muted);">${c.email || ''}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><code style="color:var(--secondary);font-size:0.78rem;">${c.nit || '—'}</code></td>
                                <td>${c.contact || '—'}</td>
                                <td>${c.phone || '—'}</td>
                                <td>${c.address || '—'}</td>
                                <td>
                                    <div style="font-size:0.8rem;">
                                        <div style="color:var(--accent);font-weight:700;">$${Math.round(totalSpent).toLocaleString()}</div>
                                        <div style="color:var(--text-muted);font-size:0.7rem;">${clientSales.length} comprobantes</div>
                                    </div>
                                </td>
                                <td>
                                    <div style="display:flex;gap:4px;">
                                        <button class="btn-icon" onclick="ClientsModule.renderHistory('${c.id}')" title="Historial">
                                            <i data-lucide="clock"></i>
                                        </button>
                                        <button class="btn-icon" onclick="ClientsModule.renderModal('${c.id}')" title="Editar">
                                            <i data-lucide="edit-3"></i>
                                        </button>
                                        <button class="btn-icon btn-danger" onclick="ClientsModule.delete('${c.id}')" title="Eliminar">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async renderHistory(clientId) {
        const client = this._clients.find(c => String(c.id) === String(clientId));
        if (!client) return;

        const sales = this._sales.filter(s => String(s.clientId) === String(clientId) || (s.client || '').toLowerCase() === (client.name || '').toLowerCase());

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width:700px;">
                <div class="modal-header">
                    <h2><i data-lucide="clock"></i> Historial de Facturación — ${client.name}</h2>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()"><i data-lucide="x"></i></button>
                </div>
                <div class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr><th>Factura #</th><th>Fecha</th><th>Total</th><th>Estado</th></tr>
                        </thead>
                        <tbody>
                            ${sales.length ? sales.map(s => `
                                <tr>
                                    <td><code style="color:var(--accent);">${s.id}</code></td>
                                    <td>${new Date(s.date).toLocaleDateString()}</td>
                                    <td style="color:var(--accent);font-weight:700;">$${(s.total || 0).toLocaleString()}</td>
                                    <td><span class="badge badge-success">${s.status || 'PAGADA'}</span></td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" class="empty-state">Sin facturas registradas</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async renderModal(clientId = null) {
        let client = { name: '', nit: '', contact: '', email: '', phone: '', address: '', type: 'Corporativo', notes: '' };
        if (clientId) {
            const found = this._clients.find(c => String(c.id) === String(clientId));
            if (found) client = { ...client, ...found };
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width:680px;">
                <div class="modal-header">
                    <h2><i data-lucide="user"></i> ${clientId ? 'Editar' : 'Nuevo'} Cliente</h2>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()"><i data-lucide="x"></i></button>
                </div>
                <form id="client-form">
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Razón Social / Nombre Completo *</label>
                            <input type="text" id="c-name" value="${client.name}" required placeholder="Empresa o Persona">
                        </div>
                        <div class="form-group">
                            <label>NIT / CC</label>
                            <input type="text" id="c-nit" value="${client.nit || ''}" placeholder="Documento">
                        </div>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Persona de Contacto</label>
                            <input type="text" id="c-contact" value="${client.contact || ''}" placeholder="Representante">
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="tel" id="c-phone" value="${client.phone || ''}" placeholder="Número de contacto">
                        </div>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Correo Electrónico</label>
                            <input type="email" id="c-email" value="${client.email || ''}" placeholder="cliente@correo.com">
                        </div>
                        <div class="form-group">
                            <label>Tipo de Cliente</label>
                            <select id="c-type">
                                ${['Corporativo','Persona Natural','Distribuidor','Gobierno'].map(t => `<option ${client.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Dirección</label>
                        <input type="text" id="c-address" value="${client.address || ''}" placeholder="Ubicación">
                    </div>
                    <div class="form-group">
                        <label>Notas Adicionales</label>
                        <textarea id="c-notes" rows="2" placeholder="Observaciones sobre el cliente...">${client.notes || ''}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="save"></i> Guardar Cliente
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('client-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                ...client,
                name:    document.getElementById('c-name').value,
                nit:     document.getElementById('c-nit').value,
                contact: document.getElementById('c-contact').value,
                phone:   document.getElementById('c-phone').value,
                email:   document.getElementById('c-email').value,
                type:    document.getElementById('c-type').value,
                address: document.getElementById('c-address').value,
                notes:   document.getElementById('c-notes').value,
            };
            UI.setLoading(true);
            await API.saveClient(data);
            UI.setLoading(false);
            UI.showToast(clientId ? 'Cliente actualizado' : 'Cliente registrado', 'success');
            modal.remove();
            this._loadAll();
        };
    },

    async delete(clientId) {
        const ok = await UI.confirm('¿Eliminar Cliente?', 'Se eliminará el registro del cliente. Las facturas asociadas se mantendrán en el histórico de ventas.', 'Eliminar');
        if (!ok) return;
        let all = await API.getClients();
        all = all.filter(c => String(c.id) !== String(clientId));
        await Store.save(Store.TABLES.CLIENTS, all);
        UI.showToast('Cliente eliminado', 'success');
        this._loadAll();
    }
};
window.ClientsModule = ClientsModule;
