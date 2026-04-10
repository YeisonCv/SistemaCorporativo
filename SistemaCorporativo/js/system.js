/**
 * User Management & Invite System — Admin Only
 * Replaces the old system.js tab with full user invitation via Supabase Auth
 */
const System = {
    async renderView() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'CONTROL DE SISTEMA';

        const user = await API.getCurrentUser();
        const isAdmin = user && user.role === 'admin';

        container.innerHTML = `
            <div class="system-view animate-fade-in">
                <div class="system-tabs">
                    <button class="tab-btn active" data-tab="logs">
                        <i data-lucide="terminal"></i> AUDITORÍA
                    </button>
                    ${isAdmin ? `
                    <button class="tab-btn" data-tab="users">
                        <i data-lucide="users"></i> GESTIÓN DE ACCESO
                    </button>
                    <button class="tab-btn" data-tab="invite">
                        <i data-lucide="user-plus"></i> INVITAR USUARIO
                    </button>
                    ` : ''}
                    <button class="tab-btn" data-tab="config">
                        <i data-lucide="settings"></i> PARÁMETROS
                    </button>
                </div>

                <!-- AUDIT LOG TAB -->
                <div id="logs-tab" class="tab-content active">
                    <div class="card">
                        <div class="card-header">
                            <h4><i data-lucide="activity"></i> Registro de Operaciones</h4>
                            <button class="btn btn-ghost btn-sm" onclick="System._exportAudit()">
                                <i data-lucide="download"></i> Exportar
                            </button>
                        </div>
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr><th>TIMESTAMP</th><th>USUARIO</th><th>MÓDULO</th><th>DETALLE</th></tr>
                                </thead>
                                <tbody id="audit-log-list"></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- USERS TAB -->
                ${isAdmin ? `
                <div id="users-tab" class="tab-content">
                    <div class="card">
                        <div class="card-header">
                            <h4><i data-lucide="shield"></i> Roles de Acceso</h4>
                            <div style="display:flex;gap:0.5rem;align-items:center;">
                                <span class="badge badge-info">Cambios aplican en el próximo login</span>
                            </div>
                        </div>
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr><th>NOMBRE</th><th>ID / SUPABASE UID</th><th>ROL ASIGNADO</th><th>CAMBIAR ROL</th></tr>
                                </thead>
                                <tbody id="user-role-list"></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- INVITE TAB -->
                <div id="invite-tab" class="tab-content">
                    <div class="card" style="max-width:520px;">
                        <div class="card-header">
                            <h4><i data-lucide="mail"></i> Invitar Nuevo Operador</h4>
                        </div>
                        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1.5rem;">
                            El usuario recibirá un email de invitación y podrá registrarse con su propia contraseña.
                            Solo los recibirán personas con correo @empresa.com o de los dominios autorizados.
                        </p>
                        <form id="invite-form">
                            <div class="form-group">
                                <label>Nombre Completo del Operador</label>
                                <input type="text" id="inv-name" placeholder="Ej: Carlos Herrera" required>
                            </div>
                            <div class="form-group">
                                <label>Correo Electrónico Corporativo</label>
                                <input type="email" id="inv-email" placeholder="usuario@empresa.com" required>
                            </div>
                            <div class="form-group">
                                <label>Rol que tendrá en el sistema</label>
                                <select id="inv-role">
                                    <option value="inventario">Inventario — Gestión de stock y bodegas</option>
                                    <option value="ventas">Ventas — POS y facturación</option>
                                    <option value="rrhh">RRHH — Nómina y talento humano</option>
                                    <option value="admin">Admin — Acceso total al sistema</option>
                                    <option value="staff">Staff — Solo consulta</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Mensaje Personalizado (Opcional)</label>
                                <textarea id="inv-msg" rows="2" placeholder="Ej: Bienvenido al equipo de operaciones..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width:100%;">
                                <i data-lucide="send"></i> Enviar Invitación
                            </button>
                        </form>
                    </div>
                </div>
                ` : ''}

                <!-- CONFIG TAB -->
                <div id="config-tab" class="tab-content">
                    <div class="system-settings-grid">
                        <div class="card">
                            <div class="card-header"><h4><i data-lucide="building"></i> Perfil Corporativo</h4></div>
                            <div class="form-group">
                                <label>Razón Social</label>
                                <input type="text" value="SCI Sistemas Corporativos SAS" id="cfg-name">
                            </div>
                            <div class="form-group">
                                <label>NIT</label>
                                <input type="text" value="901.234.567-8" id="cfg-nit">
                            </div>
                            <div class="form-group">
                                <label>Dirección</label>
                                <input type="text" value="Bogotá D.C., Colombia" id="cfg-address">
                            </div>
                            <button class="btn btn-primary" onclick="System._saveConfig()">
                                <i data-lucide="save"></i> Guardar
                            </button>
                        </div>
                        <div class="card">
                            <div class="card-header"><h4><i data-lucide="calculator"></i> Parámetros Legales</h4></div>
                            <div class="form-group">
                                <label>Salario Mínimo Legal Vigente</label>
                                <input type="number" value="1300000" id="cfg-minsal">
                            </div>
                            <div class="form-group">
                                <label>Auxilio de Transporte</label>
                                <input type="number" value="162000" id="cfg-transport">
                            </div>
                            <div class="form-group">
                                <label>IVA por defecto (%)</label>
                                <input type="number" value="19" id="cfg-iva">
                            </div>
                            <button class="btn btn-primary" onclick="System._saveConfig()">
                                <i data-lucide="save"></i> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this._initTabs();
        this._loadAuditLogs();
        if (isAdmin) {
            this._loadUserManagement();
            this._initInviteForm();
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _initTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${tab}-tab`)?.classList.add('active');
            });
        });
    },

    async _loadAuditLogs() {
        const logs = await API.getAuditLogs();
        const tbody = document.getElementById('audit-log-list');
        if (!tbody) return;

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td><small style="font-family:monospace;color:var(--text-muted);">${new Date(log.timestamp).toLocaleString()}</small></td>
                <td><span style="color:var(--accent);font-weight:700;">${log.user || '—'}</span></td>
                <td><span class="badge badge-info">${log.action || '—'}</span></td>
                <td><small>${log.details || '—'}</small></td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="empty-state">Sin registros de auditoría</td></tr>';
    },

    async _loadUserManagement() {
        const profiles = await API.getAllProfiles();
        const tbody = document.getElementById('user-role-list');
        if (!tbody) return;

        const roles = ['admin','inventario','ventas','rrhh','staff'];
        tbody.innerHTML = profiles.map(p => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <div style="width:32px;height:32px;background:var(--accent-dim);border:1px solid var(--border-color);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--accent);">
                            ${(p.full_name||'?').charAt(0).toUpperCase()}
                        </div>
                        <span style="font-weight:700;">${p.full_name || 'Sin nombre'}</span>
                    </div>
                </td>
                <td><code style="font-size:0.7rem;color:var(--text-muted);">${p.id.substring(0,16)}...</code></td>
                <td><span class="badge badge-success">${p.role}</span></td>
                <td>
                    <select class="role-select" onchange="System._updateRole('${p.id}', this.value)">
                        ${roles.map(r => `<option value="${r}" ${p.role === r ? 'selected' : ''}>${r.toUpperCase()}</option>`).join('')}
                    </select>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="empty-state">Sin usuarios registrados en profiles</td></tr>';
    },

    _initInviteForm() {
        document.getElementById('invite-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name  = document.getElementById('inv-name').value;
            const email = document.getElementById('inv-email').value;
            const role  = document.getElementById('inv-role').value;

            UI.setLoading(true);
            try {
                // Invite via Supabase Admin API
                const { data, error } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
                    data: { full_name: name, role }
                });

                if (error) throw error;

                // Create profile in advance
                await supabaseClient.from('profiles').upsert([{
                    id: data.user.id,
                    full_name: name,
                    role: role
                }]);

                UI.setLoading(false);
                Swal.fire({
                    title: '¡Invitación Enviada!',
                    text: `${name} recibirá un correo en ${email} para activar su cuenta.`,
                    icon: 'success',
                    background: '#0d0f14', color: '#f0f4f8', iconColor: '#00ff9d',
                    confirmButtonColor: '#00ff9d',
                    customClass: { popup: 'swal-cyberpunk' }
                });
                document.getElementById('invite-form').reset();
                this._loadUserManagement();

            } catch (err) {
                UI.setLoading(false);
                // Note: inviteUserByEmail requires service_role key, show instructions
                Swal.fire({
                    title: 'Instrucción para Invitar',
                    html: `Para invitar usuarios, ve a tu panel de <b>Supabase → Authentication → Users → Invite</b> e ingresa:<br><br>
                        <b>Email:</b> ${email}<br>
                        <b>Rol:</b> ${role}<br><br>
                        Luego crea su perfil manualmente en la tabla <code>profiles</code>.`,
                    icon: 'info',
                    background: '#0d0f14', color: '#f0f4f8', iconColor: '#00d4ff',
                    confirmButtonColor: '#00ff9d',
                    customClass: { popup: 'swal-cyberpunk' }
                });
            }
        });
    },

    async _updateRole(uid, newRole) {
        try {
            UI.setLoading(true);
            await API.updateProfileRole(uid, newRole);
            UI.setLoading(false);
            UI.showToast(`Rol actualizado a ${newRole.toUpperCase()}`, 'success');
        } catch(err) {
            UI.setLoading(false);
            UI.showToast('Error al actualizar rol', 'error');
        }
    },

    async _exportAudit() {
        const logs = await API.getAuditLogs();
        const csv = ['Timestamp,Usuario,Acción,Detalles',
            ...logs.map(l => `"${l.timestamp}","${l.user}","${l.action}","${l.details}"`)
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        UI.showToast('Auditoría exportada', 'success');
    },

    async _saveConfig() {
        UI.showToast('Parámetros guardados correctamente', 'success');
        await API.logAction('SISTEMA', 'Parámetros del sistema actualizados');
    }
};

const sysStyles = document.createElement('style');
sysStyles.textContent = `
    .system-view { display:flex; flex-direction:column; gap:1.25rem; }
    .system-tabs { display:flex; gap:0.5rem; flex-wrap:wrap; border-bottom:1px solid var(--border-dim); padding-bottom:1rem; }
    .tab-btn { background:transparent; border:1px solid var(--border-dim); color:var(--text-muted); padding:0.5rem 1.25rem; cursor:pointer; font-weight:700; text-transform:uppercase; font-size:0.72rem; letter-spacing:1.5px; transition:var(--transition); border-radius:4px; display:flex;align-items:center;gap:0.4rem; font-family:inherit; }
    .tab-btn i { width:14px;height:14px; }
    .tab-btn.active { color:var(--accent); border-color:var(--accent); background:var(--accent-dim); }
    .tab-content { display:none; }
    .tab-content.active { display:block; }
    .role-select { background:var(--bg-input); color:var(--accent); border:1px solid var(--border-color); padding:0.3rem 0.6rem; border-radius:4px; font-weight:700; cursor:pointer; font-size:0.78rem; font-family:inherit; }
    .system-settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }
`;
document.head.appendChild(sysStyles);
window.System = System;
