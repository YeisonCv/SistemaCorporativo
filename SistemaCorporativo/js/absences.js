/**
 * Absences - Gestión de Novedades (Incapacidades, Licencias, Vacaciones)
 */
const Absences = {
    _records: [],

    async renderView() {
        const container = document.getElementById('view-content');
        document.getElementById('page-title').innerText = 'NOVEDADES E INCAPACIDADES';

        container.innerHTML = `
            <div class="animate-fade-in" style="display:flex;flex-direction:column;gap:1.25rem;">
                <div class="view-actions">
                    <div class="search-box">
                        <i data-lucide="search"></i>
                        <input type="text" placeholder="Buscar novedad..." id="nov-search">
                    </div>
                    <button class="btn btn-primary" id="add-nov-btn">
                        <i data-lucide="file-plus"></i> Registrar Novedad
                    </button>
                </div>

                <div class="card">
                    <div class="data-table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>Tipo de Novedad</th>
                                    <th>Inicio</th>
                                    <th>Fin</th>
                                    <th>Días</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="nov-list">
                                <tr><td colspan="6" class="empty-state">Cargando novedades...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Dummy data initialization for presentation purposes if empty
        this._records = [
            { id: 1, empName: "Carlos Herrera", type: "Incapacidad Enfermedad General", start: "2026-04-05", end: "2026-04-08", days: 3 },
            { id: 2, empName: "María Rojas", type: "Vacaciones Disfrutadas", start: "2026-03-15", end: "2026-03-30", days: 15 }
        ];

        this._render();
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        document.getElementById('add-nov-btn').addEventListener('click', () => this.renderModal());
    },

    _render(filter = '') {
        const tbody = document.getElementById('nov-list');
        if (!tbody) return;

        const term = filter.toLowerCase().trim();
        const filtered = this._records.filter(r => r.empName.toLowerCase().includes(term) || r.type.toLowerCase().includes(term));

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay novedades registradas</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(r => `
            <tr>
                <td style="font-weight:700;">${r.empName}</td>
                <td><span class="badge ${r.type.includes('Incapacidad') ? 'badge-danger' : 'badge-info'}">${r.type}</span></td>
                <td>${r.start}</td>
                <td>${r.end}</td>
                <td style="color:var(--accent);font-weight:900;">${r.days}</td>
                <td>
                    <button class="btn-icon btn-danger" onclick="Absences.delete(${r.id})"><i data-lucide="trash-2"></i></button>
                </td>
            </tr>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async renderModal() {
        UI.setLoading(true);
        const employees = await API.getEmployees();
        UI.setLoading(false);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width:550px;">
                <div class="modal-header">
                    <h2><i data-lucide="file-plus"></i> Registrar Novedad</h2>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()"><i data-lucide="x"></i></button>
                </div>
                <form id="nov-form">
                    <div class="form-group">
                        <label>Colaborador</label>
                        <select id="n-emp" required>
                            ${employees.map(e => `<option value="${e.name}">${e.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tipo de Novedad</label>
                        <select id="n-type" required>
                            <option>Incapacidad Enfermedad General</option>
                            <option>Incapacidad ARL</option>
                            <option>Licencia Maternidad/Paternidad</option>
                            <option>Licencia No Remunerada</option>
                            <option>Vacaciones Disfrutadas</option>
                        </select>
                    </div>
                    <div class="form-group-row">
                        <div class="form-group">
                            <label>Fecha Inicio</label>
                            <input type="date" id="n-start" required>
                        </div>
                        <div class="form-group">
                            <label>Fecha Fin</label>
                            <input type="date" id="n-end" required>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Registrar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('nov-form').onsubmit = (e) => {
            e.preventDefault();
            const start = document.getElementById('n-start').value;
            const end = document.getElementById('n-end').value;
            const sDate = new Date(start);
            const eDate = new Date(end);
            const diffTime = Math.abs(eDate - sDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            this._records.push({
                id: Date.now(),
                empName: document.getElementById('n-emp').value,
                type: document.getElementById('n-type').value,
                start, end, days: diffDays || 1
            });
            UI.showToast('Novedad registrada exitosamente', 'success');
            modal.remove();
            this._render();
        };
    },

    delete(id) {
        this._records = this._records.filter(r => r.id !== id);
        UI.showToast('Novedad eliminada', 'success');
        this._render();
    }
};
window.Absences = Absences;
