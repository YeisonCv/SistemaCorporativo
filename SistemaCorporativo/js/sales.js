/**
 * Sales / POS — Fixed cart, client selector, light-mode selects
 */
const Sales = {
    cart: [],
    _products: [],
    _clients: [],

    async renderSales() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'VENTAS / POS';

        UI.setLoading(true);
        this._products = await API.getProducts();
        this._clients  = await API.getClients();
        UI.setLoading(false);

        const clientOptions = this._clients.length
            ? this._clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
            : '<option value="0">Cliente General</option>';

        container.innerHTML = `
            <div class="pos-container animate-fade-in">
                <!-- Catalog -->
                <div class="pos-catalog">
                    <div class="view-actions" style="margin-bottom:0;">
                        <div class="search-box" style="max-width:100%;">
                            <i data-lucide="search"></i>
                            <input type="text" placeholder="Buscar producto..." id="pos-search">
                        </div>
                    </div>
                    <div class="pos-grid" id="pos-products"></div>
                </div>

                <!-- Cart -->
                <div class="pos-cart-panel card">
                    <div class="cart-header">
                        <h3><i data-lucide="shopping-cart"></i> Carrito</h3>
                        <button class="btn-icon" id="clear-cart" title="Vaciar">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                    <div class="cart-items" id="cart-list">
                        <div class="empty-cart">Selecciona productos para comenzar</div>
                    </div>
                    <div class="cart-summary">
                        <div class="summary-line"><span>Subtotal</span><span id="cart-subtotal">$0</span></div>
                        <div class="summary-line"><span>IVA (19%)</span><span id="cart-tax">$0</span></div>
                        <div class="summary-total"><span>TOTAL</span><span id="cart-total">$0</span></div>
                        <div class="form-group" style="margin-top:0.75rem;">
                            <label>Cliente</label>
                            <select id="pos-client">${clientOptions}</select>
                        </div>
                        <button class="btn btn-primary" id="checkout-btn" disabled style="width:100%;margin-top:0.75rem;">
                            <i data-lucide="credit-card"></i> Finalizar Venta
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.cart = [];
        this._renderProducts(this._products);

        document.getElementById('pos-search').addEventListener('input', e => {
            const term = e.target.value.toLowerCase().trim();
            const filtered = this._products.filter(p =>
                (p.name || '').toLowerCase().includes(term) ||
                (p.sku  || '').toLowerCase().includes(term)
            );
            this._renderProducts(filtered);
        });

        document.getElementById('clear-cart').onclick = () => {
            this.cart = [];
            this._updateCartUI();
        };
        document.getElementById('checkout-btn').onclick = () => this._handleCheckout();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _renderProducts(products) {
        const grid = document.getElementById('pos-products');
        if (!grid) return;

        const categories = [...new Set(products.map(p => p.category || 'General'))];

        grid.innerHTML = products.map(p => `
            <div class="product-card" onclick="Sales.addToCart(${p.id})">
                <div class="product-card-img">${this._emoji(p.category)}</div>
                <div style="font-weight:700;font-size:0.82rem;line-height:1.3;">${p.name}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;">${p.sku || ''}</div>
                <div style="color:var(--accent);font-weight:900;margin-top:auto;">$${(p.price||0).toLocaleString()}</div>
                <div style="font-size:0.68rem;color:${p.stock <= 0 ? 'var(--danger)' : 'var(--text-muted)'};">
                    ${p.stock <= 0 ? 'SIN STOCK' : `Stock: ${p.stock}`}
                </div>
            </div>
        `).join('') || '<div class="empty-state">Sin productos que coincidan</div>';
    },

    _emoji(cat) {
        const m = { 'Hardware':'🖥️','Software':'💿','Wearables':'⌚','Electrónica':'⚡','Periféricos':'🖱️' };
        return m[cat] || '📦';
    },

    addToCart(productId) {
        const product = this._products.find(p => p.id === productId || p.id === String(productId));
        if (!product) return;

        if (product.stock <= 0) { UI.showToast('Sin stock disponible', 'warning'); return; }

        const existing = this.cart.find(item => String(item.pId) === String(productId));
        if (existing) {
            if (existing.qty < product.stock) existing.qty++;
            else { UI.showToast('Límite de stock alcanzado', 'warning'); return; }
        } else {
            this.cart.push({ pId: product.id, name: product.name, price: product.price, qty: 1 });
        }
        this._updateCartUI();
    },

    _updateCartUI() {
        const list = document.getElementById('cart-list');
        const btn  = document.getElementById('checkout-btn');
        if (!list || !btn) return;

        if (this.cart.length === 0) {
            list.innerHTML = '<div class="empty-cart">Selecciona productos para comenzar</div>';
            btn.disabled = true;
        } else {
            list.innerHTML = this.cart.map((item, idx) => `
                <div class="cart-item">
                    <div>
                        <span class="cart-item-name">${item.name}</span>
                        <span class="cart-item-price">$${(item.price||0).toLocaleString()} × ${item.qty}</span>
                    </div>
                    <div style="display:flex;gap:4px;align-items:center;">
                        <button class="btn-icon" onclick="Sales._changeQty(${idx},-1)"><i data-lucide="minus"></i></button>
                        <span style="font-weight:900;min-width:20px;text-align:center;">${item.qty}</span>
                        <button class="btn-icon" onclick="Sales._changeQty(${idx},1)"><i data-lucide="plus"></i></button>
                        <button class="btn-icon btn-danger" onclick="Sales._removeItem(${idx})"><i data-lucide="x"></i></button>
                    </div>
                </div>
            `).join('');
            btn.disabled = false;
        }

        const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
        const tax   = subtotal * 0.19;
        const total = subtotal + tax;
        document.getElementById('cart-subtotal').innerText = `$${Math.round(subtotal).toLocaleString()}`;
        document.getElementById('cart-tax').innerText      = `$${Math.round(tax).toLocaleString()}`;
        document.getElementById('cart-total').innerText    = `$${Math.round(total).toLocaleString()}`;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _changeQty(idx, delta) {
        const item = this.cart[idx];
        const prod = this._products.find(p => String(p.id) === String(item.pId));
        item.qty = Math.max(1, Math.min(item.qty + delta, prod?.stock || 999));
        this._updateCartUI();
    },

    _removeItem(idx) {
        this.cart.splice(idx, 1);
        this._updateCartUI();
    },

    async _handleCheckout() {
        if (!this.cart.length) return;
        const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
        const tax   = subtotal * 0.19;
        const saleData = {
            clientId: document.getElementById('pos-client')?.value,
            items: this.cart,
            subtotal, tax,
            total: subtotal + tax,
            client: this._clients.find(c => String(c.id) === document.getElementById('pos-client')?.value)?.name || 'Cliente General'
        };
        UI.setLoading(true);
        try {
            const result = await API.createSale(saleData);
            UI.setLoading(false);
            if (result.success) {
                Swal.fire({
                    title: '¡Venta Procesada!',
                    html: `<b style="color:var(--accent);font-size:1.4rem;">${result.sale.id}</b><br><small>Total: $${Math.round(result.sale.total).toLocaleString()}</small>`,
                    icon: 'success',
                    background: 'var(--bg-card)', color: 'var(--text-primary)', iconColor: 'var(--success)',
                    confirmButtonColor: 'var(--accent)', confirmButtonText: 'NUEVA VENTA',
                    showDenyButton: true,
                    denyButtonText: `<i data-lucide="printer"></i> Imprimir Recibo`,
                    denyButtonColor: 'var(--bg-input)'
                }).then((r) => {
                    if (r.isDenied) {
                        window.print();
                    }
                });
                this.cart = [];
                this._products = await API.getProducts();
                this._renderProducts(this._products);
                this._updateCartUI();
                setTimeout(() => document.getElementById('pos-search')?.focus(), 500);
            }
        } catch(err) {
            UI.setLoading(false);
            UI.showToast('Error al procesar la venta', 'error');
        }
    }
};
window.Sales = Sales;
