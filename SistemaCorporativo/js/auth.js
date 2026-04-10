/**
 * Auth — Cyberpunk Login View with SweetAlert2 error handling
 */
const Auth = {
    async renderLogin() {
        const container = document.getElementById('login-container');
        container.style.cssText = `
            display: flex; align-items: center; justify-content: center;
            height: 100vh; width: 100vw; position: fixed; top:0; left:0; z-index: 2000;
        `;

        container.innerHTML = `
            <div class="auth-card animate-fade-in">
                <div class="auth-header">
                    <div class="auth-logo-wrap">
                        <i data-lucide="layers" class="auth-logo-icon"></i>
                    </div>
                    <h1 data-text="SCI ERP">SCI ERP</h1>
                    <p>Sistema Corporativo Integral</p>
                    <span class="auth-version">Cloud v3.0 — Supabase</span>
                </div>
                <form id="login-form" autocomplete="on">
                    <div class="auth-input-group">
                        <i data-lucide="user" class="auth-input-icon"></i>
                        <input type="text" id="email" required placeholder="tu.nombre">
                        <div style="position:absolute;right:15px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-weight:700;pointer-events:none;font-size:0.85rem;">
                            @sci-erp.com
                        </div>
                    </div>
                    <div class="auth-input-group">
                        <i data-lucide="lock" class="auth-input-icon"></i>
                        <input type="password" id="password" autocomplete="current-password" required placeholder="Contraseña">
                        <button type="button" class="auth-eye-btn" id="toggle-pass">
                            <i data-lucide="eye" id="eye-icon"></i>
                        </button>
                    </div>
                    <button type="submit" class="auth-submit-btn" id="login-btn">
                        <span>Acceder al Sistema</span>
                        <i data-lucide="arrow-right"></i>
                    </button>
                </form>
                <p class="auth-footer-note">Acceso restringido — SCI Sistemas Corporativos SAS</p>
            </div>
        `;

        // Inject styles
        this._injectStyles();
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Password toggle
        document.getElementById('toggle-pass').addEventListener('click', () => {
            const pass = document.getElementById('password');
            const eyeIcon = document.getElementById('eye-icon');
            if (pass.type === 'password') {
                pass.type = 'text';
                eyeIcon.setAttribute('data-lucide', 'eye-off');
            } else {
                pass.type = 'password';
                eyeIcon.setAttribute('data-lucide', 'eye');
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });

        // Submit
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            let email = document.getElementById('email').value.trim();
            if (!email.includes('@')) {
                email += '@sci-erp.com';
            }
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-btn');

            btn.disabled = true;
            btn.innerHTML = `<span>Autenticando...</span><i data-lucide="loader"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            try {
                const result = await API.login(email, password);
                if (result.success) {
                    Swal.fire({
                        title: 'Acceso Autorizado',
                        text: `Bienvenido al sistema, ${result.user?.full_name || email.split('@')[0]}`,
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        iconColor: 'var(--success)',
                    }).then(() => { window.location.hash = '#/dashboard'; });
                }
            } catch (error) {
                Swal.fire({
                    title: 'Acceso Denegado',
                    text: 'Credenciales inválidas. Verifique su correo y contraseña.',
                    icon: 'error',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    iconColor: 'var(--danger)',
                    confirmButtonColor: 'var(--accent)',
                    confirmButtonText: 'Reintentar'
                });
                btn.disabled = false;
                btn.innerHTML = `<span>Acceder al Sistema</span><i data-lucide="arrow-right"></i>`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });
    },

    async handleLogout() {
        const confirmed = await UI.confirm('¿Cerrar Sesión?', 'Tu sesión será terminada de forma segura.', 'Salir del Sistema');
        if (!confirmed) return;
        await API.logout();
        window.location.hash = '#/login';
        UI.showToast('Sesión cerrada correctamente', 'success');
    },

    _injectStyles() {
        if (document.getElementById('auth-styles')) return;
        const s = document.createElement('style');
        s.id = 'auth-styles';
        s.textContent = `
            #login-container {
                background: radial-gradient(ellipse at 20% 30%, rgba(0,255,157,0.06) 0%, transparent 50%),
                            radial-gradient(ellipse at 80% 70%, rgba(0,212,255,0.05) 0%, transparent 50%),
                            var(--bg-main);
            }
            .auth-card {
                width: 100%;
                max-width: 420px;
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 3rem 2.5rem;
                backdrop-filter: blur(30px);
                box-shadow: 0 0 60px rgba(0,255,157,0.08), 0 30px 60px rgba(0,0,0,0.6);
                position: relative;
                overflow: hidden;
            }
            .auth-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, var(--accent), transparent);
            }
            .auth-header { text-align: center; margin-bottom: 2.5rem; }
            .auth-logo-wrap {
                width: 64px; height: 64px;
                background: var(--accent-dim);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 1.5rem;
                box-shadow: 0 0 20px var(--accent-glow);
            }
            .auth-logo-icon { width: 30px; height: 30px; color: var(--accent); }
            .auth-header h1 {
                font-size: 1.75rem; font-weight: 900;
                color: var(--text-primary);
                letter-spacing: 4px; text-transform: uppercase;
                margin-bottom: 0.4rem;
            }
            .auth-header p { color: var(--text-muted); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 2px; }
            .auth-version {
                display: inline-block;
                margin-top: 0.75rem;
                font-size: 0.65rem;
                color: var(--accent);
                letter-spacing: 1px;
                border: 1px solid var(--border-color);
                padding: 2px 8px;
                border-radius: 20px;
            }
            .auth-input-group {
                position: relative;
                margin-bottom: 1rem;
            }
            .auth-input-icon {
                position: absolute;
                left: 12px; top: 50%;
                transform: translateY(-50%);
                width: 16px; height: 16px;
                color: var(--text-muted);
                pointer-events: none;
            }
            .auth-input-group input {
                width: 100%;
                background: var(--bg-input);
                border: 1px solid var(--border-dim);
                border-radius: 6px;
                padding: 0.8rem 2.75rem 0.8rem 2.5rem;
                color: var(--text-primary);
                font-family: inherit;
                font-size: 0.9rem;
                transition: var(--transition);
            }
            .auth-input-group input:focus {
                outline: none;
                border-color: var(--accent);
                box-shadow: 0 0 0 3px var(--accent-dim), 0 0 12px var(--accent-glow);
            }
            .auth-eye-btn {
                position: absolute;
                right: 10px; top: 50%;
                transform: translateY(-50%);
                background: none; border: none;
                color: var(--text-muted); cursor: pointer; padding: 4px;
            }
            .auth-eye-btn i { width: 15px; height: 15px; display: block; }
            .auth-submit-btn {
                width: 100%; margin-top: 0.5rem;
                background: var(--accent);
                color: #050608;
                border: none; border-radius: 6px;
                padding: 0.875rem;
                font-weight: 900; font-size: 0.85rem;
                font-family: inherit;
                text-transform: uppercase; letter-spacing: 2px;
                cursor: pointer;
                display: flex; align-items: center; justify-content: center; gap: 0.75rem;
                transition: var(--transition);
                box-shadow: 0 0 20px var(--accent-glow);
            }
            .auth-submit-btn:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 0 30px var(--accent); }
            .auth-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .auth-submit-btn i { width: 16px; height: 16px; }
            .auth-footer-note {
                margin-top: 2rem;
                text-align: center;
                font-size: 0.68rem;
                color: var(--text-muted);
                letter-spacing: 0.5px;
            }
        `;
        document.head.appendChild(s);
    }
};
