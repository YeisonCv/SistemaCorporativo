/**
 * HR - Human Resources and Payroll Module
 */
const HR = {
    async renderEmployees() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'Gestión de Capital Humano';

        container.innerHTML = `
            <div class="hr-view animate-fade-in">
                <div class="view-actions">
                    <div class="search-box">
                        <i data-lucide="search"></i>
                        <input type="text" placeholder="Buscar colaborador..." id="hr-search">
                    </div>
                    <button class="btn btn-primary" id="add-employee-btn">
                        <i data-lucide="user-plus"></i> Vincular Colaborador
                    </button>
                </div>

                <div class="employees-grid" id="employees-list">
                    <!-- Employees cards injected here -->
                </div>
            </div>
        `;

        this.loadEmployees();

        document.getElementById('add-employee-btn').onclick = () => this.renderEmployeeModal();
        document.getElementById('hr-search').oninput = (e) => this.loadEmployees(e.target.value);
    },

    async loadEmployees(filter = '') {
        const employees = await API.getEmployees();
        const grid = document.getElementById('employees-list');
        const term = filter.toLowerCase();

        const filtered = employees.filter(e => e.name.toLowerCase().includes(term) || e.role.toLowerCase().includes(term));

        grid.innerHTML = filtered.map(e => `
            <div class="employee-card card animate-fade-in">
                <div class="emp-status-badge ${e.status.toLowerCase()}">${e.status}</div>
                <div class="emp-avatar">
                    <i data-lucide="user"></i>
                </div>
                <div class="emp-info">
                    <h4>${e.name}</h4>
                    <span class="emp-role">${e.role}</span>
                </div>
                <div class="emp-details">
                    <div class="detail-item">
                        <label>Salario</label>
                        <span>$${e.salary.toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Ingreso</label>
                        <span>${e.joinDate}</span>
                    </div>
                </div>
                <div class="emp-actions">
                    <button class="btn btn-ghost btn-block" onclick="HR.renderEmployeeModal(${e.id})">
                        <i data-lucide="edit-2"></i> Gestionar
                    </button>
                </div>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async renderEmployeeModal(employeeId = null) {
        let employee = { name: '', role: 'Operativo', salary: 1300000, status: 'Activo', joinDate: new Date().toISOString().split('T')[0] };
        if (employeeId) {
            const employees = await API.getEmployees();
            employee = employees.find(e => e.id === employeeId);
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2><i data-lucide="user-cog"></i> Perfil de Colaborador</h2>
                    <button class="btn-icon" id="close-modal"><i data-lucide="x"></i></button>
                </div>
                <form id="employee-form">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="e-name" value="${employee.name}" required>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Cargo / Rol</label>
                            <input type="text" id="e-role" value="${employee.role}" required>
                        </div>
                        <div class="form-group">
                            <label>Estado</label>
                            <select id="e-status">
                                <option ${employee.status === 'Activo' ? 'selected' : ''}>Activo</option>
                                <option ${employee.status === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Salario Base</label>
                            <input type="number" id="e-salary" value="${employee.salary}" required>
                        </div>
                        <div class="form-group">
                            <label>Fecha Incorporación</label>
                            <input type="date" id="e-date" value="${employee.joinDate}">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-ghost" id="cancel-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Perfil</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const closeModal = () => modal.remove();
        document.getElementById('close-modal').onclick = closeModal;
        document.getElementById('cancel-modal').onclick = closeModal;

        document.getElementById('employee-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                ...employee,
                name: document.getElementById('e-name').value,
                role: document.getElementById('e-role').value,
                salary: parseInt(document.getElementById('e-salary').value),
                status: document.getElementById('e-status').value,
                joinDate: document.getElementById('e-date').value
            };

            await API.saveEmployee(data);
            UI.showToast('Información de colaborador guardada');
            closeModal();
            this.loadEmployees();
        };
    }
};

// HR Styles
const hrStyle = document.createElement('style');
hrStyle.textContent = `
    .employees-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-top: 1rem;
    }
    .employee-card {
        padding: 2rem;
        text-align: center;
        position: relative;
        overflow: hidden;
    }
    .emp-avatar {
        width: 72px;
        height: 72px;
        background: var(--bg-hover);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.25rem;
        color: var(--accent);
        border: 2px solid var(--border-color);
    }
    .emp-avatar i { width: 32px; height: 32px; }
    .emp-info h4 { font-size: 1.15rem; margin-bottom: 0.25rem; }
    .emp-role { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
    
    .emp-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin: 1.5rem 0;
        padding: 1rem 0;
        border-top: 1px dashed var(--border-color);
        border-bottom: 1px dashed var(--border-color);
    }
    .detail-item label { display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-item span { font-weight: 600; font-size: 0.9rem; }
    
    .emp-status-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 0.65rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 700;
        text-transform: uppercase;
    }
    .emp-status-badge.activo { background: rgba(16, 185, 129, 0.1); color: var(--accent); }
    .emp-status-badge.inactivo { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
`;
document.head.appendChild(hrStyle);
window.HR = HR;
