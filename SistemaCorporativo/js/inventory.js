/**
 * Inventory — Fixed filtering, product photos, robust modals
 */
const Inventory = {
    _products: [],

    async renderList() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'INVENTARIOS';

        container.innerHTML = `
            <div class="inventory-view animate-fade-in">
                <div class="view-actions">
                    <div class="search-box">
                        <i data-lucide="search"></i>
                        <input type="text" placeholder="Buscar por nombre, SKU o categoría..." id="product-search">
                    </div>
                    <div style="display:flex;gap:1.5rem;align-items:center;">
                        <label style="cursor:pointer; display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:var(--text-muted); font-weight:600;">
                            <input type="checkbox" id="critical-stock-filter"> Mostrar solo Críticos
                        </label>
                        <button class="btn btn-ghost" id="export-inv-btn">
                            <i data-lucide="download"></i> Exportar
                        </button>
                        <button class="btn btn-primary" id="add-product-btn">
                            <i data-lucide="plus"></i> Nuevo Producto
                        </button>
                    </div>
                </div>
                <div class="card">
                    <div id="products-table-container"></div>
                </div>
            </div>
        `;

        UI.setLoading(true);
        this._products = await API.getProducts();
        UI.setLoading(false);
        this.displayProducts(this._products);

        document.getElementById('add-product-btn').addEventListener('click', () => this.renderProductModal());
        
        const applyFilters = () => {
            const term = document.getElementById('product-search').value.toLowerCase().trim();
            const criticalOnly = document.getElementById('critical-stock-filter').checked;
            
            let filtered = this._products;
            
            if (term) {
                filtered = filtered.filter(p => 
                    (p.name || '').toLowerCase().includes(term) ||
                    (p.sku  || '').toLowerCase().includes(term) ||
                    (p.category || '').toLowerCase().includes(term)
                );
            }
            if (criticalOnly) {
                filtered = filtered.filter(p => (p.stock || 0) <= (p.minStock || 5));
            }
            this.displayProducts(filtered);
        };

        document.getElementById('product-search').addEventListener('input', applyFilters);
        document.getElementById('critical-stock-filter').addEventListener('change', applyFilters);
        document.getElementById('export-inv-btn').addEventListener('click', () => this.exportCSV());

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    exportCSV() {
        const rows = [['SKU', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Precio', 'Costo']];
        this._products.forEach(p => {
            rows.push([
                p.sku || '', `"${p.name || ''}"`, p.category || '', 
                p.stock || 0, p.minStock || 5, p.price || 0, p.cost || 0
            ]);
        });
        const csv = rows.map(r => r.join(',')).join('\\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        UI.showToast('Inventario exportado', 'success');
    },

    displayProducts(products) {
        const container = document.getElementById('products-table-container');
        if (!container) return;

        if (!products || products.length === 0) {
            container.innerHTML = '<div class="empty-state">[ Sin productos registrados ]</div>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>SKU</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Precio Venta</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:0.75rem;">
                                    <div class="product-thumb">${this._getEmoji(p.category)}</div>
                                    <div>
                                        <div style="font-weight:700;">${p.name || '—'}</div>
                                        <div style="font-size:0.72rem;color:var(--text-muted);">${p.description || ''}</div>
                                    </div>
                                </div>
                            </td>
                            <td><code style="color:var(--accent);font-size:0.78rem;">${p.sku || '—'}</code></td>
                            <td><span class="badge badge-info">${p.category || '—'}</span></td>
                            <td>
                                <span class="${p.stock <= (p.minStock || 5) ? 'text-danger' : 'text-success'}" style="font-weight:700;">
                                    ${p.stock ?? 0} ${p.unit || 'UND'}
                                </span>
                            </td>
                            <td style="color:var(--accent);font-weight:700;">$${(p.price || 0).toLocaleString()}</td>
                            <td>
                                <button class="btn-icon" onclick="Inventory.renderProductModal('${p.id}')" title="Editar">
                                    <i data-lucide="edit-3"></i>
                                </button>
                                <button class="btn-icon btn-danger" onclick="Inventory.deleteProduct('${p.id}')" title="Eliminar">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _getEmoji(category) {
        const map = {
            'Hardware': '🖥️', 'Software': '💿', 'Wearables': '⌚',
            'Electrónica': '⚡', 'Periféricos': '🖱️', 'Mobiliario': '🪑',
            'Servicios': '🛠️', 'Consumibles': '📦'
        };
        return map[category] || '📦';
    },

    async deleteProduct(productId) {
        const ok = await UI.confirm('¿Eliminar Producto?', 'Esta acción no se puede deshacer.', 'Eliminar');
        if (!ok) return;
        let products = await API.getProducts();
        products = products.filter(p => String(p.id) !== String(productId));
        await Store.save(Store.TABLES.PRODUCTS, products);
        UI.showToast('Producto eliminado', 'success');
        this.renderList();
    },

    async renderMovements() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'KARDEX / MOVIMIENTOS';

        container.innerHTML = `
            <div class="movements-view animate-fade-in">
                <div class="view-actions">
                    <h4 style="color:var(--text-muted);font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;">
                        Historial de Entradas y Salidas de Inventario
                    </h4>
                    <button class="btn btn-primary" id="record-move-btn">
                        <i data-lucide="arrow-left-right"></i> Registrar Movimiento
                    </button>
                </div>
                <div class="card">
                    <div id="movements-table-container"></div>
                </div>
            </div>
        `;

        UI.setLoading(true);
        const movements = await API.getMovements();
        const products  = await API.getProducts();
        UI.setLoading(false);

        const container2 = document.getElementById('movements-table-container');
        if (!movements || movements.length === 0) {
            container2.innerHTML = '<div class="empty-state">[ Sin movimientos registrados. Crea una venta o una orden de compra para verlos aquí. ]</div>';
        } else {
            container2.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Referencia</th>
                            <th>Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${movements.map(m => {
                            const prod = products.find(p => String(p.id) === String(m.productId));
                            return `
                                <tr>
                                    <td><small>${new Date(m.date).toLocaleString()}</small></td>
                                    <td><span class="badge badge-${m.type === 'ENTRADA' ? 'success' : 'danger'}">${m.type}</span></td>
                                    <td>${prod ? prod.name : `ID: ${m.productId}`}</td>
                                    <td style="font-weight:700;">${m.quantity}</td>
                                    <td><small>${m.reference || '—'}</small></td>
                                    <td style="color:var(--accent);">${m.user || '—'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }

        document.getElementById('record-move-btn').addEventListener('click', () => this.renderMoveModal());
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async renderMoveModal() {
        const products = await API.getProducts();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2><i data-lucide="arrow-left-right"></i> Registrar Movimiento</h2>
                    <button class="btn-icon" id="close-modal"><i data-lucide="x"></i></button>
                </div>
                <form id="move-form">
                    <div class="form-group">
                        <label>Producto</label>
                        <select id="move-product" required>
                            <option value="">— Seleccionar —</option>
                            ${products.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Tipo</label>
                            <select id="move-type" required>
                                <option value="ENTRADA">ENTRADA (+)</option>
                                <option value="SALIDA">SALIDA (−)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Cantidad</label>
                            <input type="number" id="move-qty" min="1" required placeholder="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Referencia / Nota</label>
                        <input type="text" id="move-ref" placeholder="Ej: Ajuste de inventario">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-ghost" id="cancel-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Movimiento</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const closeModal = () => modal.remove();
        document.getElementById('close-modal').onclick = closeModal;
        document.getElementById('cancel-modal').onclick = closeModal;

        document.getElementById('move-form').onsubmit = async (e) => {
            e.preventDefault();
            const user = await API.getCurrentUser();
            const data = {
                productId: document.getElementById('move-product').value,
                type:      document.getElementById('move-type').value,
                quantity:  parseInt(document.getElementById('move-qty').value),
                reference: document.getElementById('move-ref').value,
                user:      user?.full_name || 'Admin'
            };
            UI.setLoading(true);
            await API.recordMovement(data);
            UI.setLoading(false);
            UI.showToast('Movimiento registrado con éxito');
            closeModal();
            this.renderMovements();
        };
    },

    async renderProductModal(productId = null) {
        let product = { sku: '', name: '', category: 'Hardware', barcode: '', cost: 0, price: 0, tax: 19, stock: 0, minStock: 5, unit: 'UND', supplier: '', description: '' };
        if (productId) {
            const found = await API.getProductById(productId);
            if (found) product = { ...product, ...found };
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width:680px;">
                <div class="modal-header">
                    <h2><i data-lucide="${productId ? 'edit-3' : 'plus-circle'}"></i> ${productId ? 'Editar' : 'Nuevo'} Producto</h2>
                    <button class="btn-icon" id="close-modal"><i data-lucide="x"></i></button>
                </div>
                <form id="product-form">
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Nombre del Producto *</label>
                            <input type="text" id="p-name" value="${product.name}" required placeholder="Ej: Laptop Core i9">
                        </div>
                        <div class="form-group">
                            <label>SKU / Referencia</label>
                            <input type="text" id="p-sku" value="${product.sku || ''}" placeholder="Ej: LAP-001">
                        </div>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Categoría</label>
                            <select id="p-cat">
                                ${['Hardware','Software','Wearables','Electrónica','Periféricos','Mobiliario','Servicios','Consumibles']
                                    .map(c => `<option ${product.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Unidad de Medida</label>
                            <select id="p-unit">
                                ${['UND','KG','LT','MT','CJA','PAR'].map(u => `<option ${product.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Costo de Compra ($)</label>
                            <input type="number" id="p-cost" value="${product.cost || 0}" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Precio de Venta ($)</label>
                            <input type="number" id="p-price" value="${product.price || 0}" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>IVA (%)</label>
                            <input type="number" id="p-tax" value="${product.tax || 19}" min="0" max="100">
                        </div>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Stock Actual</label>
                            <input type="number" id="p-stock" value="${product.stock || 0}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Stock Mínimo Alerta</label>
                            <input type="number" id="p-minstock" value="${product.minStock || 5}" min="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea id="p-desc" rows="2" placeholder="Descripción técnica del producto...">${product.description || ''}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-ghost" id="cancel-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="save"></i> Guardar Producto
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const closeModal = () => modal.remove();
        document.getElementById('close-modal').onclick = closeModal;
        document.getElementById('cancel-modal').onclick = closeModal;

        document.getElementById('product-form').onsubmit = async (e) => {
            e.preventDefault();
            const updated = {
                ...product,
                name:        document.getElementById('p-name').value,
                sku:         document.getElementById('p-sku').value,
                category:    document.getElementById('p-cat').value,
                unit:        document.getElementById('p-unit').value,
                cost:        parseFloat(document.getElementById('p-cost').value) || 0,
                price:       parseFloat(document.getElementById('p-price').value) || 0,
                tax:         parseInt(document.getElementById('p-tax').value) || 19,
                stock:       parseInt(document.getElementById('p-stock').value) || 0,
                minStock:    parseInt(document.getElementById('p-minstock').value) || 5,
                description: document.getElementById('p-desc').value
            };

            UI.setLoading(true);
            await API.saveProduct(updated);
            UI.setLoading(false);
            UI.showToast(productId ? 'Producto actualizado' : 'Producto creado', 'success');
            closeModal();
            this.renderList();
        };
    }
};

// Inventory styles
const _invStyle = document.createElement('style');
_invStyle.textContent = `
    .inventory-view { display: flex; flex-direction: column; gap: 1.25rem; }
    .product-thumb { width: 36px; height: 36px; background: var(--accent-dim); border: 1px solid var(--border-color); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .movements-view { display: flex; flex-direction: column; gap: 1.25rem; }
`;
document.head.appendChild(_invStyle);
window.Inventory = Inventory;
