/**
 * Profile View - Enhanced User Profile module
 */
const ProfileView = {
    async renderView() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'MI PERFIL';

        UI.setLoading(true);
        const user = await API.getCurrentUser();
        // Get employees to try to find matching department/extension if available
        let dept = 'Operaciones', ext = 'N/A';
        try {
            const employees = await API.getEmployees();
            const emp = employees.find(e => (e.name||'').toLowerCase() === (user?.full_name||'').toLowerCase());
            if (emp) {
                dept = emp.department || dept;
                ext = emp.id || ext; // Dummy extension
            }
        } catch (e) { console.warn(e); }
        UI.setLoading(false);

        if (!user) {
            window.location.hash = '#/login';
            return;
        }

        const initials = (user.full_name || user.email || '?').substring(0, 2).toUpperCase();

        container.innerHTML = `
            <div class="profile-view animate-fade-in">
                <div class="profile-header card">
                    <div class="profile-avatar">
                        ${initials}
                    </div>
                    <div class="profile-info">
                        <h2>${user.full_name || 'Operador'}</h2>
                        <span class="profile-role badge badge-success">${user.role.toUpperCase()}</span>
                        <div class="profile-meta">
                            <span><i data-lucide="mail"></i> ${user.email}</span>
                            <span><i data-lucide="briefcase"></i> ${dept}</span>
                            <span><i data-lucide="phone"></i> Ext. ${ext}</span>
                        </div>
                    </div>
                </div>

                <div class="profile-actions-grid">
                    <div class="card">
                        <div class="card-header">
                            <h4><i data-lucide="shield"></i> Seguridad y Acceso</h4>
                        </div>
                        <form id="change-pass-form">
                            <div class="form-group">
                                <label>Nueva Contraseña</label>
                                <input type="password" id="new-password" required placeholder="Mínimo 6 caracteres">
                            </div>
                            <div class="form-group">
                                <label>Confirmar Contraseña</label>
                                <input type="password" id="confirm-password" required placeholder="Repetir nueva contraseña">
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i data-lucide="key"></i> Actualizar Contraseña
                            </button>
                        </form>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h4><i data-lucide="activity"></i> Resumen de Cuenta</h4>
                        </div>
                        <ul class="profile-stats">
                            <li>
                                <span>Estado de Cuenta</span>
                                <span class="badge badge-success">Activo</span>
                            </li>
                            <li>
                                <span>Último Acceso</span>
                                <span>${new Date().toLocaleDateString()}</span>
                            </li>
                            <li>
                                <span>ID del Sistema</span>
                                <code style="color:var(--accent);font-size:0.75rem;">${user.id.substring(0, 13)}...</code>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('change-pass-form').onsubmit = async (e) => {
            e.preventDefault();
            const pass1 = document.getElementById('new-password').value;
            const pass2 = document.getElementById('confirm-password').value;

            if (pass1 !== pass2) {
                UI.showToast('Las contraseñas no coinciden', 'error');
                return;
            }

            if (pass1.length < 6) {
                UI.showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
                return;
            }

            UI.setLoading(true);
            try {
                const { error } = await supabaseClient.auth.updateUser({ password: pass1 });
                if (error) throw error;
                UI.showToast('Contraseña actualizada correctamente', 'success');
                document.getElementById('change-pass-form').reset();
                await API.logAction('PERFIL', 'Cambio de contraseña exitoso');
            } catch (error) {
                UI.showToast('Error al actualizar contraseña. Intenta reingresar.', 'error');
            } finally {
                UI.setLoading(false);
            }
        };
    }
};

const profileStyle = document.createElement('style');
profileStyle.textContent = `
    .profile-view { display: flex; flex-direction: column; gap: 1.5rem; }
    .profile-header {
        display: flex;
        align-items: center;
        gap: 2rem;
        padding: 2.5rem;
        background: linear-gradient(135deg, var(--bg-card) 0%, rgba(0, 255, 157, 0.05) 100%);
        border: 1px solid var(--border-color);
        box-shadow: 0 10px 30px rgba(0,255,157,0.05);
    }
    .profile-avatar {
        width: 100px;
        height: 100px;
        border-radius: 20px;
        background: var(--bg-hover);
        border: 2px solid var(--accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        font-weight: 900;
        color: var(--accent);
        box-shadow: 0 0 20px var(--accent-glow);
        text-shadow: 0 0 10px var(--accent-glow);
        flex-shrink: 0;
    }
    .profile-info h2 { font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: -0.5px; }
    .profile-role { margin-bottom: 1rem; display: inline-block; font-size: 0.75rem; }
    .profile-meta { display: flex; gap: 1.5rem; color: var(--text-secondary); font-size: 0.85rem; flex-wrap: wrap; }
    .profile-meta span { display: flex; align-items: center; gap: 0.5rem; }
    .profile-meta i { width: 16px; height: 16px; color: var(--accent); }
    .profile-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .profile-stats { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
    .profile-stats li { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid var(--border-dim); font-size: 0.85rem; }
    .profile-stats li:last-child { border-bottom: none; padding-bottom: 0; }
    .profile-stats span:first-child { color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; font-size: 0.75rem; }
    .profile-stats span:last-child { font-weight: 700; color: var(--text-primary); }
`;
document.head.appendChild(profileStyle);
window.ProfileView = ProfileView;
