/**
 * Suppliers (Proveedores) Module — Completo
 */
const Suppliers = {
    async renderView() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'PROVEEDORES';

        container.innerHTML = `
            <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:1.25rem;">
                <div class="view-actions">
                    <div class="search-box">
                        <i data-lucide="search"></i>
                        <input type="text" placeholder="Buscar proveedor por nombre o NIT..." id="sup-search">
                    </div>
                    <button class="btn btn-primary" id="add-supplier-btn">
                        <i data-lucide="building-2"></i> Nuevo Proveedor
                    </button>
                </div>

                <!-- KPI strip -->
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;" id="sup-kpis"></div>

                <div class="card">
                    <div id="suppliers-table-container"></div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('add-supplier-btn').addEventListener('click', () => this.renderModal());
        document.getElementById('sup-search').addEventListener('input', e => this._render(e.target.value));

        await this._loadAll();
    },

    async _loadAll(filter = '') {
        UI.setLoading(true);
        const suppliers = await API.getSuppliers();
        const purchases = await API.getPurchases();
        UI.setLoading(false);

        // KPIs
        const kpis = document.getElementById('sup-kpis');
        if (kpis) {
            const totalSpend = purchases.reduce((a, p) => a + (p.total || 0), 0);
            kpis.innerHTML = `
                <div class="stat-glass-card">
                    <div class="stat-icon-box"><i data-lucide="building-2"></i></div>
                    <div class="stat-data"><h3>${suppliers.length}</h3><label>Proveedores Activos</label></div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-icon-box"><i data-lucide="truck"></i></div>
                    <div class="stat-data"><h3>${purchases.length}</h3><label>Órdenes de Compra</label></div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-icon-box"><i data-lucide="dollar-sign"></i></div>
                    <div class="stat-data"><h3>$${Math.round(totalSpend).toLocaleString()}</h3><label>Total Comprado</label></div>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        this._suppliers = suppliers;
        this._purchases = purchases;
        this._render(filter);
    },

    _render(filter = '') {
        const term = filter.toLowerCase().trim();
        const filtered = (this._suppliers || []).filter(s =>
            (s.name || '').toLowerCase().includes(term) ||
            (s.nit  || '').toLowerCase().includes(term) ||
            (s.contact || '').toLowerCase().includes(term)
        );

        const c = document.getElementById('suppliers-table-container');
        if (!c) return;

        if (!filtered.length) {
            c.innerHTML = '<div class="empty-state">[ Sin proveedores registrados — Añade uno nuevo ]</div>';
            return;
        }

        c.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Empresa</th>
                        <th>NIT</th>
                        <th>Contacto</th>
                        <th>Teléfono</th>
                        <th>Categoría</th>
                        <th>Cond. Pago</th>
                        <th>Compras</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(s => {
                        const supplierPurchases = (this._purchases || []).filter(p =>
                            (p.supplier || '').toLowerCase() === (s.name || '').toLowerCase()
                        );
                        const totalSpend = supplierPurchases.reduce((a, p) => a + (p.total || 0), 0);
                        return `
                            <tr>
                                <td>
                                    <div style="display:flex;align-items:center;gap:0.75rem;">
                                        <div style="width:34px;height:34px;background:var(--accent-dim);border:1px solid var(--border-color);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--accent);font-size:0.85rem;flex-shrink:0;">
                                            ${(s.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style="font-weight:700;">${s.name || '—'}</div>
                                            <div style="font-size:0.7rem;color:var(--text-muted);">${s.email || ''}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><code style="color:var(--secondary);font-size:0.78rem;">${s.nit || '—'}</code></td>
                                <td>${s.contact || '—'}</td>
                                <td>${s.phone || '—'}</td>
                                <td><span class="badge badge-info">${s.category || 'General'}</span></td>
                                <td><span class="badge badge-warning">${s.paymentTerms || '30 días'}</span></td>
                                <td>
                                    <div style="font-size:0.8rem;">
                                        <div style="color:var(--accent);font-weight:700;">$${Math.round(totalSpend).toLocaleString()}</div>
                                        <div style="color:var(--text-muted);font-size:0.7rem;">${supplierPurchases.length} órdenes</div>
                                    </div>
                                </td>
                                <td>
                                    <div style="display:flex;gap:4px;">
                                        <button class="btn-icon" onclick="Suppliers.renderHistory('${s.id}')" title="Historial">
                                            <i data-lucide="clock"></i>
                                        </button>
                                        <button class="btn-icon" onclick="Suppliers.renderModal('${s.id}')" title="Editar">
                                            <i data-lucide="edit-3"></i>
                                        </button>
                                        <button class="btn-icon btn-danger" onclick="Suppliers.delete('${s.id}')" title="Eliminar">
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

    async renderHistory(supplierId) {
        const suppliers = await API.getSuppliers();
        const supplier = suppliers.find(s => String(s.id) === String(supplierId));
        if (!supplier) return;

        const purchases = (await API.getPurchases()).filter(p =>
            (p.supplier || '').toLowerCase() === (supplier.name || '').toLowerCase()
        );

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width:700px;">
                <div class="modal-header">
                    <h2><i data-lucide="clock"></i> Historial — ${supplier.name}</h2>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()"><i data-lucide="x"></i></button>
                </div>
                <div class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr><th>OC #</th><th>Fecha</th><th>Ítems</th><th>Total</th><th>Estado</th></tr>
                        </thead>
                        <tbody>
                            ${purchases.length ? purchases.map(p => `
                                <tr>
                                    <td><code style="color:var(--accent);">${p.id}</code></td>
                                    <td>${new Date(p.date).toLocaleDateString()}</td>
                                    <td>${(p.items || []).length}</td>
                                    <td style="color:var(--accent);font-weight:700;">$${(p.total || 0).toLocaleString()}</td>
                                    <td><span class="badge badge-success">${p.status || 'RECIBIDA'}</span></td>
                                </tr>
                            `).join('') : '<tr><td colspan="5" class="empty-state">Sin órdenes de compra</td></tr>'}
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

    async renderModal(supplierId = null) {
        let supplier = { name: '', nit: '', contact: '', email: '', phone: '', address: '', category: 'Tecnología', paymentTerms: '30 días', notes: '' };
        if (supplierId) {
            const all = await API.getSuppliers();
            const found = all.find(s => String(s.id) === String(supplierId));
            if (found) supplier = { ...supplier, ...found };
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width:680px;">
                <div class="modal-header">
                    <h2><i data-lucide="building-2"></i> ${supplierId ? 'Editar' : 'Nuevo'} Proveedor</h2>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()"><i data-lucide="x"></i></button>
                </div>
                <form id="supplier-form">
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Nombre / Razón Social *</label>
                            <input type="text" id="s-name" value="${supplier.name}" required placeholder="Empresa S.A.S.">
                        </div>
                        <div class="form-group">
                            <label>NIT / Identificación</label>
                            <input type="text" id="s-nit" value="${supplier.nit || ''}" placeholder="900.123.456-7">
                        </div>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Persona de Contacto</label>
                            <input type="text" id="s-contact" value="${supplier.contact || ''}" placeholder="Nombre del representante">
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="tel" id="s-phone" value="${supplier.phone || ''}" placeholder="+57 300 000 0000">
                        </div>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Email Corporativo</label>
                            <input type="email" id="s-email" value="${supplier.email || ''}" placeholder="contacto@empresa.com">
                        </div>
                        <div class="form-group">
                            <label>Categoría</label>
                            <select id="s-cat">
                                ${['Tecnología','Insumos','Logística','Servicios','Manufactura','Importaciones','Otros']
                                    .map(c => `<option ${supplier.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Condición de Pago</label>
                            <select id="s-terms">
                                ${['Contado','15 días','30 días','45 días','60 días','90 días']
                                    .map(t => `<option ${supplier.paymentTerms === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Dirección</label>
                            <input type="text" id="s-address" value="${supplier.address || ''}" placeholder="Ciudad, Dirección">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Notas Internas</label>
                        <textarea id="s-notes" rows="2" placeholder="Observaciones, condiciones especiales...">${supplier.notes || ''}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="save"></i> Guardar Proveedor
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('supplier-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                ...supplier,
                name:         document.getElementById('s-name').value,
                nit:          document.getElementById('s-nit').value,
                contact:      document.getElementById('s-contact').value,
                phone:        document.getElementById('s-phone').value,
                email:        document.getElementById('s-email').value,
                category:     document.getElementById('s-cat').value,
                paymentTerms: document.getElementById('s-terms').value,
                address:      document.getElementById('s-address').value,
                notes:        document.getElementById('s-notes').value,
            };
            UI.setLoading(true);
            await API.saveSupplier(data);
            UI.setLoading(false);
            UI.showToast(supplierId ? 'Proveedor actualizado' : 'Proveedor creado', 'success');
            modal.remove();
            this._loadAll();
        };
    },

    async delete(supplierId) {
        const ok = await UI.confirm('¿Eliminar Proveedor?', 'Se eliminará el registro. Las órdenes de compra no se borrarán.', 'Eliminar');
        if (!ok) return;
        let all = await API.getSuppliers();
        all = all.filter(s => String(s.id) !== String(supplierId));
        await Store.save(Store.TABLES.SUPPLIERS, all);
        UI.showToast('Proveedor eliminado', 'success');
        this._loadAll();
    }
};
window.Suppliers = Suppliers;
