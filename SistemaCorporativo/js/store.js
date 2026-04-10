/**
 * Store - Bridge to Supabase Backend
 * All methods are now asynchronous to handle network requests.
 */
const Store = {
    // Table names in Supabase
    TABLES: {
        PRODUCTS: 'products',
        MOVEMENTS: 'movements',
        WAREHOUSES: 'warehouses',
        CLIENTS: 'clients',
        EMPLOYEES: 'employees',
        SALES: 'sales',
        PURCHASES: 'purchases',
        AUDIT: 'audit_log',
        CONFIG: 'config'
    },

    async init() {
        console.log('Connecting to SCI Cloud (Supabase)...');
        // Check for local migration
        const migrationDone = localStorage.getItem('sci_migration_v3');
        if (!migrationDone) {
            await this.migrateLocalToCloud();
        }
    },

    /**
     * One-time migration from LocalStorage to Supabase
     */
    async migrateLocalToCloud() {
        console.warn('Iniciando migración única de datos a SCI Cloud...');
        const keysMap = {
            'sci_products': this.TABLES.PRODUCTS,
            'sci_warehouses': this.TABLES.WAREHOUSES,
            'sci_movements': this.TABLES.MOVEMENTS,
            'sci_clients': this.TABLES.CLIENTS,
            'sci_employees': this.TABLES.EMPLOYEES,
            'sci_sales': this.TABLES.SALES,
            'sci_purchases': this.TABLES.PURCHASES,
            'sci_audit': this.TABLES.AUDIT,
            'sci_config': this.TABLES.CONFIG
        };

        try {
            for (const [localKey, tableName] of Object.entries(keysMap)) {
                const localData = localStorage.getItem(localKey);
                if (localData) {
                    const parsedData = JSON.parse(localData);
                    console.log(`Migrando ${tableName}...`);
                    await this.save(tableName, parsedData);
                }
            }
            localStorage.setItem('sci_migration_v3', 'done');
            console.log('Migración completada con éxito.');
        } catch (e) {
            console.error('Error durante la migración:', e);
        }
    },

    async get(tableName) {
        try {
            const { data, error } = await supabaseClient
                .from(tableName)
                .select('data');
            
            if (error) throw error;
            
            // Our structure stores everything inside the 'data' JSONB column
            // We return an array of the 'data' objects
            return data.map(item => item.data);
        } catch (error) {
            console.error(`Error fetching from ${tableName}:`, error);
            return [];
        }
    },

    /**
     * For config or single-row tables
     */
    async getSingle(tableName) {
        try {
            const { data, error } = await supabaseClient
                .from(tableName)
                .select('data')
                .limit(1)
                .single();
            
            if (error) return null;
            return data.data;
        } catch (error) {
            return null;
        }
    },

    async save(tableName, objectData) {
        try {
            // If it's a new item (no ID), we insert. 
            // If it has an ID, we assume we are replacing the whole collection 
            // (Current app logic often saves the whole array).
            // For true ERP, we should insert row by row, but to keep the app working NOW:
            
            // Logic: Is this an array or a single object?
            if (Array.isArray(objectData)) {
                // Clear and re-insert (Simple migration path)
                await supabaseClient.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                const inserts = objectData.map(d => ({ data: d }));
                const { error } = await supabaseClient.from(tableName).insert(inserts);
                if (error) throw error;
            } else {
                // Single object (e.g. Config)
                const { error } = await supabaseClient.from(tableName).upsert({ id: '00000000-0000-0000-0000-000000000001', data: objectData });
                if (error) throw error;
            }
            return { success: true };
        } catch (error) {
            console.error(`Error saving to ${tableName}:`, error);
            return { success: false, error };
        }
    },

    /**
     * Optimized insert for single records (Movements, Sales, etc)
     */
    async insert(tableName, singleObject) {
        try {
            const { error } = await supabaseClient
                .from(tableName)
                .insert([{ data: singleObject }]);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`Error inserting into ${tableName}:`, error);
            return { success: false };
        }
    }
};

// Wait for App to initialize manually
// Store.init() was removed from here to prevent double initialization
