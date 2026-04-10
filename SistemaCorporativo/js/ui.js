/**
 * UI - Helpers, Toasts (SweetAlert2), Loading Bar
 */
const UI = {
    showToast(message, type = 'success') {
        const icons = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
        const colors = { success: '#00ff9d', error: '#ff0055', warning: '#ffcc00', info: '#00d4ff' };
        const bgDark = document.documentElement.getAttribute('data-theme') === 'dark';

        Swal.fire({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3500,
            timerProgressBar: true,
            icon: icons[type] || 'info',
            title: message,
            background: bgDark ? '#0d0f14' : '#fff',
            color: bgDark ? '#f0f4f8' : '#0d1117',
            iconColor: colors[type] || colors.success,
            customClass: {
                popup: 'swal-cyberpunk-toast',
                timerProgressBar: 'swal-progress'
            }
        });
    },

    async confirm(title, text, confirmText = 'Confirmar') {
        const bgDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const result = await Swal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancelar',
            background: bgDark ? '#0d0f14' : '#fff',
            color: bgDark ? '#f0f4f8' : '#0d1117',
            iconColor: '#ffcc00',
            confirmButtonColor: '#00ff9d',
            cancelButtonColor: 'transparent',
            customClass: {
                popup: 'swal-cyberpunk',
                confirmButton: 'swal-btn-confirm',
                cancelButton: 'swal-btn-cancel'
            }
        });
        return result.isConfirmed;
    },

    setLoading(isLoading) {
        const bar = document.getElementById('loading-bar');
        const main = document.getElementById('main-container');

        if (!bar || !main) return;

        if (isLoading) {
            bar.style.width = '75%';
            bar.style.opacity = '1';
            main.style.opacity = '0.65';
            main.style.pointerEvents = 'none';
        } else {
            bar.style.width = '100%';
            setTimeout(() => {
                bar.style.opacity = '0';
                bar.style.width = '0';
                main.style.opacity = '1';
                main.style.pointerEvents = 'auto';
            }, 300);
        }
    },

    renderTable(containerId, columns, data, onAction) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-state">[ Sin datos registrados ]</div>';
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col.label}</th>`).join('')}
                        ${onAction ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${data.map((row, idx) => `
                        <tr>
                            ${columns.map(col => `
                                <td>${col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}</td>
                            `).join('')}
                            ${onAction ? `
                                <td>
                                    <button class="btn-icon" onclick="window.handleAction(${idx}, '${row.id}')">
                                        <i data-lucide="edit-3"></i>
                                    </button>
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// SweetAlert2 Cyberpunk Custom Styles
const swalStyle = document.createElement('style');
swalStyle.textContent = `
    .swal-cyberpunk { border: 1px solid rgba(0,255,157,0.3) !important; border-radius: 8px !important; }
    .swal-cyberpunk .swal2-title { font-size: 1rem !important; text-transform: uppercase; letter-spacing: 2px; }
    .swal-btn-confirm { background: #00ff9d !important; color: #050608 !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 1px !important; border-radius: 4px !important; box-shadow: 0 0 15px rgba(0,255,157,0.4) !important; }
    .swal-btn-cancel { border: 1px solid #333 !important; background: transparent !important; color: #8899a6 !important; border-radius: 4px !important; }
    .swal-cyberpunk-toast { border-left: 3px solid var(--ti-color, #00ff9d) !important; border-radius: 6px !important; font-size: 0.88rem !important; }
    .swal-progress { background: #00ff9d !important; }
`;
document.head.appendChild(swalStyle);
