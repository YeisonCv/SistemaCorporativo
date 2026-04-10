/**
 * API - Abstraction Layer for Data access
 * Now integrated with Supabase Cloud & RBAC Profiles
 */
const API = {
    // Helper to simulate network delay
    _delay(ms = 100) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Auth & RBAC
    async login(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw new Error(error.message);

        // Ensure user has a profile
        const user = await this.getCurrentUser();
        return { success: true, user };
    },

    async logout() {
        await supabaseClient.auth.signOut();
        return { success: true };
    },

    async getCurrentUser() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return null;

        // Fetch Extended Profile (Role, Full Name)
        let { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // One-time initialization if profile is missing
        if (error || !profile) {
            const newProfile = {
                id: user.id,
                full_name: user.email.split('@')[0],
                role: 'admin' // First user or fallback as admin for now
            };
            const { data: createdProfile } = await supabaseClient
                .from('profiles')
                .insert([newProfile])
                .select()
                .single();
            profile = createdProfile;
        }

        return {
            ...user,
            ...profile
        };
    },

    /**
     * Get all user profiles (Admin only)
     */
    async getAllProfiles() {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*');
        if (error) throw error;
        return data;
    },

    async updateProfileRole(uid, newRole) {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ role: newRole })
            .eq('id', uid);
        if (error) throw error;
        await this.logAction('USUARIOS', `Rol actualizado para usuario ${uid} a ${newRole}`);
        return { success: true };
    },

    // Products
    async getProducts() {
        return await Store.get(Store.TABLES.PRODUCTS);
    },

    async getProductById(id) {
        const products = await this.getProducts();
        return products.find(p => p.id === id || p.id === parseInt(id));
    },

    async saveProduct(product) {
        let products = await this.getProducts();
        if (product.id) {
            products = products.map(p => p.id === product.id ? product : p);
        } else {
            product.id = Date.now();
            products.push(product);
        }
        await Store.save(Store.TABLES.PRODUCTS, products);
        await this.logAction('INVENTARIO', `Producto guardado/editado: ${product.name || product.data?.name}`);
        return { success: true, product };
    },

    // Clients
    async getClients() {
        return await Store.get(Store.TABLES.CLIENTS);
    },

    async saveClient(client) {
        let clients = await this.getClients();
        if (client.id) {
            clients = clients.map(c => c.id === client.id ? client : c);
        } else {
            client.id = Date.now();
            clients.push(client);
        }
        await Store.save(Store.TABLES.CLIENTS, clients);
        return { success: true, client };
    },

    // Employees
    async getEmployees() {
        return await Store.get(Store.TABLES.EMPLOYEES);
    },

    async saveEmployee(employee) {
        let employees = await this.getEmployees();
        if (employee.id) {
            employees = employees.map(e => e.id === employee.id ? employee : e);
        } else {
            employee.id = Date.now();
            employees.push(employee);
        }
        await Store.save(Store.TABLES.EMPLOYEES, employees);
        return { success: true, employee };
    },

    // Sales & POS
    async getSales() {
        return await Store.get(Store.TABLES.SALES);
    },

    async createSale(saleData) {
        const sales = await this.getSales();
        const products = await this.getProducts();
        const user = await this.getCurrentUser();
        
        const newSale = {
            id: `FAC-${1000 + sales.length + 1}`,
            date: new Date().toISOString(),
            ...saleData,
            status: 'PAGADA',
            createdBy: user.full_name
        };

        for (const item of saleData.items) {
            const product = products.find(p => p.id === parseInt(item.pId));
            if (product) {
                product.stock -= parseInt(item.qty);
                await this.recordMovement({
                    productId: product.id,
                    type: 'SALIDA',
                    quantity: item.qty,
                    reference: `Venta ${newSale.id}`,
                    user: user.full_name
                });
            }
        }

        sales.unshift(newSale);
        await Store.save(Store.TABLES.SALES, sales);
        await this.logAction('VENTA', `Factura generada: ${newSale.id} por ${user.full_name}`);
        return { success: true, sale: newSale };
    },

    // Purchases
    async getPurchases() {
        return await Store.get(Store.TABLES.PURCHASES);
    },

    async createPurchase(purchaseData) {
        const purchases = await this.getPurchases();
        const products = await this.getProducts();
        const user = await this.getCurrentUser();

        purchaseData.id = `OC-${1000 + purchases.length + 1}`;
        purchaseData.date = new Date().toISOString();
        purchaseData.createdBy = user.full_name;
        
        for (const item of purchaseData.items) {
            const product = products.find(p => p.id === parseInt(item.pId));
            if (product) {
                product.stock += parseInt(item.qty);
                await this.recordMovement({
                    productId: product.id,
                    type: 'ENTRADA',
                    quantity: item.qty,
                    reference: `Compra ${purchaseData.id}`,
                    user: user.full_name
                });
            }
        }

        purchases.unshift(purchaseData);
        await Store.save(Store.TABLES.PURCHASES, purchases);
        await this.logAction('COMPRA', `Orden de compra: ${purchaseData.id} recibida por ${user.full_name}`);
        return { success: true };
    },

    // Payroll
    async calculatePayroll(employeeId) {
        const employees = await this.getEmployees();
        const config = await this.getSystemConfig();
        const employee = employees.find(e => e.id === parseInt(employeeId));

        if (!employee) throw new Error('Colaborador no encontrado');

        const baseSalary = employee.salary;
        const transport = baseSalary <= (config.payroll.minSalary * 2) ? config.payroll.transportAllowance : 0;
        const health = baseSalary * (config.payroll.healthEmployee / 100);
        const pension = baseSalary * (config.payroll.pensionEmployee / 100);
        const netPay = baseSalary + transport - health - pension;

        return {
            employeeName: employee.name,
            baseSalary,
            transport,
            health,
            pension,
            netPay
        };
    },

    // Audit & System
    async getAuditLogs() {
        return await Store.get(Store.TABLES.AUDIT);
    },

    async logAction(action, details) {
        const logs = await this.getAuditLogs();
        const user = await this.getCurrentUser();
        logs.unshift({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            user: user ? user.full_name : 'System',
            action,
            details
        });
        await Store.save(Store.TABLES.AUDIT, logs.slice(0, 100));
    },

    async getSystemConfig() {
        return await Store.getSingle(Store.TABLES.CONFIG);
    },

    // Warehouses
    async getWarehouses() {
        return await Store.get(Store.TABLES.WAREHOUSES);
    },

    // Movements
    async getMovements() {
        return await Store.get(Store.TABLES.MOVEMENTS);
    },

    async recordMovement(movement) {
        const movements = await this.getMovements();
        const products = await this.getProducts();
        const user = await this.getCurrentUser();
        
        movement.id = Date.now();
        movement.date = movement.date || new Date().toISOString();
        movement.user = user ? user.full_name : (movement.user || 'Admin');
        movements.unshift(movement);

        const product = products.find(p => p.id === parseInt(movement.productId));
        if (product) {
            if (movement.type === 'ENTRADA') product.stock += parseInt(movement.quantity);
            else product.stock -= parseInt(movement.quantity);
        }

        await Store.save(Store.TABLES.MOVEMENTS, movements);
        await Store.save(Store.TABLES.PRODUCTS, products);
        return { success: true };
    }
};
