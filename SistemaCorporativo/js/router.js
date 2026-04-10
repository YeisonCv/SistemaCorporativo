/**
 * Router - Simple hash-based router for the SPA
 * Enhanced with RBAC (Role-Based Access Control)
 */
const Router = {
    routes: {},
    
    init(routes) {
        this.routes = routes;
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    async handleRoute() {
        const hash = window.location.hash || '#/dashboard';
        const path = hash.split('?')[0];
        console.log(`Router: Manejando ruta -> ${path}`);
        
        // Find matching route
        const route = this.routes[path] || this.routes['#/dashboard'];
        
        // Authentication & Profile Check
        const user = await API.getCurrentUser();
        const appShell = document.getElementById('app');
        const loginContainer = document.getElementById('login-container');

        if (!user && path !== '#/login') {
            window.location.hash = '#/login';
            return;
        }

        if (user && path === '#/login') {
            window.location.hash = '#/dashboard';
            return;
        }

        // --- RBAC Sidebar Filtering ---
        if (user) {
            this.filterSidebar(user.role);
            
            // Check if user has permission for this specific path
            const menuItem = document.querySelector(`.menu-item[href="${path}"]`);
            const allowedRoles = menuItem?.getAttribute('data-role');
            
            if (allowedRoles && !allowedRoles.split(',').includes(user.role)) {
                console.warn(`RBAC: Acceso denegado a ${path} para el rol ${user.role}`);
                UI.showToast('Acceso restringido para su perfil', 'error');
                window.location.hash = '#/dashboard';
                return;
            }
        }

        // Display correct container
        if (path === '#/login') {
            appShell.style.display = 'none';
            loginContainer.style.display = 'block';
        } else {
            appShell.style.display = 'flex';
            loginContainer.style.display = 'none';
        }

        // Update navigation UI
        this.updateNav(path);

        // Execute view function
        if (route) {
            UI.setLoading(true);
            try {
                const container = document.getElementById('view-content');
                if (container) {
                    container.classList.remove('view-enter');
                    void container.offsetWidth;
                    container.classList.add('view-enter');
                }
                await route();
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } catch (error) {
                console.error('Route error:', error);
                UI.showToast('Error cargando el módulo', 'error');
            }
            UI.setLoading(false);
        }
    },

    filterSidebar(role) {
        document.querySelectorAll('.menu-item').forEach(item => {
            const allowedRoles = item.getAttribute('data-role');
            // Dashboard and logout are always visible
            if (!allowedRoles) {
                item.style.display = 'flex';
                return;
            }

            if (allowedRoles.split(',').includes(role)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    },

    updateNav(path) {
        document.querySelectorAll('.menu-item').forEach(item => {
            if (item.getAttribute('href') === path) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Scroll to top
        const content = document.getElementById('view-content');
        if (content) content.scrollTop = 0;
    }
};
