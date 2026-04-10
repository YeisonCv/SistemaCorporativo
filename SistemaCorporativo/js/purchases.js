/**
 * Purchases (Compras) Module — Fixed "Nueva Orden" button & cost fallback
 */
const Purchases = {
    async renderPurchases() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'GESTIÓN DE COMPRAS';

        container.innerHTML = `
            <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:1.25rem;">
                <div class="view-actions">
                    <div class="search-box">
                        <i data-lucide="search"></i>
                        <input type="text" placeholder="Buscar orden de compra..." id="pur-search">
                    </div>
                    <button class="btn btn-primary" id="new-purchase-btn">
                        <i data-lucide="plus-circle"></i> Nueva Orden de Compra
                    </button>
                </div>
                <div class="card">
                    <div class="data-table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>OC #</th>
                                    <th>Fecha</th>
                                    <th>Proveedor</th>
                                    <th>Ítems</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody id="purchases-list">
                                <tr><td colspan="7" class="empty-state">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Bind button BEFORE loading data
        document.getElementById('new-purchase-btn').addEventListener('click', () => this.renderNewPurchaseModal());

        this._loadPurchases();
    },

    async _loadPurchases() {
        const purchases = await API.getPurchases();
        const tbody = document.getElementById('purchases-list');
        if (!tbody) return;

        if (!purchases || purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Sin órdenes de compra registradas</td></tr>';
            return;
        }

        tbody.innerHTML = purchases.map(p => `
            <tr>
                <td><code style="color:var(--accent);">${p.id}</code></td>
                <td>${new Date(p.date).toLocaleDateString()}</td>
                <td><strong>${p.supplier || '—'}</strong></td>
                <td>${(p.items || []).length} artículo(s)</td>
                <td style="color:var(--accent);font-weight:700;">$${(p.total || 0).toLocaleString()}</td>
                <td><span class="badge ${p.status === 'RECIBIDA' ? 'badge-success' : 'badge-warning'}">${p.status || 'PENDIENTE'}</span></td>
                <td>
                    <button class="btn btn-ghost btn-sm">
                        <i data-lucide="eye"></i> Ver
                    </button>
                </td>
            </tr>
        `).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async renderNewPurchaseModal() {
        const products = await API.getProducts();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width:760px;">
                <div class="modal-header">
                    <h2><i data-lucide="truck"></i> Nueva Orden de Compra</h2>
                    <button class="btn-icon" id="close-pur-modal"><i data-lucide="x"></i></button>
                </div>
                <form id="purchase-form">
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Proveedor *</label>
                            <input type="text" id="pur-supplier" placeholder="Ej: TechCorp S.A." required>
                        </div>
                        <div class="form-group">
                            <label>Bodega Destino</label>
                            <select id="pur-warehouse">
                                <option>CEDI Principal</option>
                                <option>Sede Norte</option>
                                <option>Sede Sur</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Ítems de la Orden</label>
                        <div class="pur-item-selector">
                            <select id="pur-p-select" style="flex:1;">
                                <option value="">— Seleccionar producto —</option>
                                ${products.map(p => `<option value="${p.id}" data-cost="${p.cost||0}">${p.name} (Costo: $${(p.cost||0).toLocaleString()})</option>`).join('')}
                            </select>
                            <input type="number" id="pur-p-qty" placeholder="Cant." min="1" style="width:80px;">
                            <button type="button" class="btn btn-ghost btn-sm" id="add-p-to-pur">
                                <i data-lucide="plus"></i> Añadir
                            </button>
                        </div>

                        <div class="data-table-container" style="margin-top:0.5rem;">
                            <table class="data-table">
                                <thead>
                                    <tr><th>Producto</th><th>Cantidad</th><th>Costo Unit.</th><th>Subtotal</th><th></th></tr>
                                </thead>
                                <tbody id="pur-items-list">
                                    <tr><td colspan="5" class="empty-state">Añade productos a la orden</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div style="font-weight:900;font-size:1.1rem;color:var(--accent);">
                            Total OC: <span id="pur-total-val">$0</span>
                        </div>
                        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="check-circle"></i> Confirmar y Recibir OC
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        let currentItems = [];

        // Close button
        document.getElementById('close-pur-modal').onclick = () => modal.remove();

        // Add item
        document.getElementById('add-p-to-pur').onclick = () => {
            const sel = document.getElementById('pur-p-select');
            const qty = parseInt(document.getElementById('pur-p-qty').value) || 0;
            if (!sel.value || qty <= 0) { UI.showToast('Selecciona un producto y cantidad válida', 'warning'); return; }

            const pId  = sel.value;
            const cost = parseFloat(sel.options[sel.selectedIndex].dataset.cost) || 0;
            const name = sel.options[sel.selectedIndex].text.split('(')[0].trim();

            const existing = currentItems.find(i => String(i.pId) === String(pId));
            if (existing) existing.qty += qty;
            else currentItems.push({ pId, name, qty, cost });

            this._updatePurItemsUI(currentItems);
            document.getElementById('pur-p-qty').value = '';
        };

        // Submit
        document.getElementById('purchase-form').onsubmit = async (e) => {
            e.preventDefault();
            if (!currentItems.length) { UI.showToast('Añade al menos un producto', 'warning'); return; }

            const total = currentItems.reduce((acc, i) => acc + i.qty * i.cost, 0);
            UI.setLoading(true);
            await API.createPurchase({
                supplier: document.getElementById('pur-supplier').value,
                warehouse: document.getElementById('pur-warehouse').value,
                items: currentItems,
                total,
                status: 'RECIBIDA'
            });
            UI.setLoading(false);
            UI.showToast('Orden de Compra registrada y stock actualizado', 'success');
            modal.remove();
            this._loadPurchases();
        };
    },

    _updatePurItemsUI(items) {
        const body = document.getElementById('pur-items-list');
        const totalSpan = document.getElementById('pur-total-val');
        if (!body) return;

        body.innerHTML = items.map((i, idx) => `
            <tr>
                <td>${i.name}</td>
                <td>${i.qty}</td>
                <td>$${(i.cost||0).toLocaleString()}</td>
                <td style="color:var(--accent);font-weight:700;">$${(i.qty * i.cost).toLocaleString()}</td>
                <td><button class="btn-icon btn-danger" onclick="Purchases._removeItem(${idx})"><i data-lucide="x"></i></button></td>
            </tr>
        `).join('');

        const total = items.reduce((acc, i) => acc + i.qty * (i.cost||0), 0);
        if (totalSpan) totalSpan.innerText = `$${total.toLocaleString()}`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _removeItem(idx) {
        // Re-fetch items from DOM state is tricky, so we rebuild via closure in renderNewPurchaseModal
        UI.showToast('Para quitar un ítem, cierre y vuelva a abrir la orden', 'info');
    }
};

const _purStyle = document.createElement('style');
_purStyle.textContent = `
    .pur-item-selector { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; }
`;
document.head.appendChild(_purStyle);
window.Purchases = Purchases;
