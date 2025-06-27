// UI management functions

// Initialize UI namespace if not exists
if (!window.UI) {
    window.UI = {};
}

// Extend UI namespace with additional functions
Object.assign(window.UI, {

    // Status management
    updateStatus: function (message, type) {
        const indicator = document.getElementById('status-indicator');
        if (indicator) {
            indicator.textContent = message;

            // Update icon based on type
            const icon = indicator.previousElementSibling;
            if (icon) {
                icon.className = `fas fa-circle mr-2 ${type === 'success' ? 'text-green-400' :
                    type === 'processing' ? 'text-yellow-400' :
                        'text-red-400'
                    }`;
            }
        } else {
            // Fallback: log to console if status indicator doesn't exist
            console.log(`Status: ${message} (${type})`);
        }
    },

    // Toast notifications
    showToast: function (message, type = 'info') {
        // Create toast container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 4000);
    },

    // Progress management
    updateProgress: function (operation, percentage, message) {
        const progressBar = document.getElementById(`progress-bar-${operation}`);
        const progressText = document.getElementById(`progress-text-${operation}`);

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }

        if (progressText && message) {
            progressText.textContent = message;
        }
    },

    showProgress: function (operation) {
        const progressContainer = document.getElementById(`${operation}-progress`);
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }
    },

    hideProgress: function (operation) {
        const progressContainer = document.getElementById(`${operation}-progress`);
        if (progressContainer) {
            progressContainer.classList.add('hidden');
        }

        // Reset progress
        this.updateProgress(operation, 0, '');
    },

    // Log management
    addLog: function (message) {
        const logContainer = document.getElementById('log-content');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'text-xs opacity-80';
        logEntry.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${message}`;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    },

    clearLogs: function () {
        const logContainer = document.getElementById('log-content');
        if (logContainer) {
            logContainer.innerHTML = '';
            this.addLog('🧹 Log limpo');
        }
    },

    // Error handling
    handleError: function (operation, error) {
        console.error(`Erro em ${operation}:`, error);
        this.addLog(`❌ Erro em ${operation}: ${error.message}`);
        this.showToast(`Erro: ${error.message}`, 'error');
        this.updateStatus('Erro no processamento', 'error');
        this.hideProgress(operation);

        // Re-enable buttons
        const buttons = document.querySelectorAll('button[id$="-btn"]');
        buttons.forEach(btn => {
            btn.disabled = false;
        });
    },

    // Loading states
    setLoadingState: function (operation, loading) {
        // Map operation names to actual button IDs
        const buttonMap = {
            'split': 'split-pdfs',
            'merge': 'merge-pdfs',
            'extract': 'extract-pages',
            'watermark': 'add-watermark',
            'excel': 'convert-to-excel'
        };

        const buttonId = buttonMap[operation] || `${operation}-btn`;
        const button = document.getElementById(buttonId);

        if (button) {
            if (loading) {
                button.disabled = true;
                button.innerHTML = button.innerHTML.replace(/fa-play|fa-cut|fa-layer-group|fa-scissors|fa-stamp|fa-file-excel/g, 'fa-spinner fa-spin');
            } else {
                button.disabled = false;
                // Restore original icons
                if (operation === 'split') button.innerHTML = '<i class="fas fa-cut mr-2"></i>Dividir PDFs';
                else if (operation === 'merge') button.innerHTML = '<i class="fas fa-layer-group mr-2"></i>Mesclar PDFs';
                else if (operation === 'extract') button.innerHTML = '<i class="fas fa-scissors mr-2"></i>Extrair Páginas';
                else if (operation === 'watermark') button.innerHTML = '<i class="fas fa-stamp mr-2"></i>Adicionar Marca d\'água';
                else if (operation === 'excel') button.innerHTML = '<i class="fas fa-file-excel mr-2"></i>Converter para Excel';
            }
        }
    },

    // Success handling
    handleSuccess: function (operation, message, downloadCallback) {
        this.addLog(`✅ ${message}`);
        this.showToast(message, 'success');
        this.updateStatus('Processamento concluído', 'success');
        this.hideProgress(operation);
        this.setLoadingState(operation, false);

        if (downloadCallback) {
            this.showDownloadModal(message, downloadCallback);
        }
    },

    // Modal management
    showDownloadModal: function (message, downloadCallback) {
        const modal = document.getElementById('download-modal');
        const messageEl = document.getElementById('download-message');
        const downloadBtn = document.getElementById('download-btn');

        if (modal && messageEl && downloadBtn) {
            messageEl.textContent = message;
            downloadBtn.onclick = downloadCallback;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },

    closeDownloadModal: function () {
        const modal = document.getElementById('download-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    showHelp: function () {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },

    closeHelp: function () {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    // File validation
    validatePagesFormat: function (input) {
        const pattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
        return pattern.test(input.replace(/\s/g, ''));
    },

    parsePagesInput: function (input) {
        const pages = [];
        const parts = input.split(',');

        parts.forEach(part => {
            part = part.trim();
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(n => parseInt(n));
                for (let i = start; i <= end; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(parseInt(part));
            }
        });

        return [...new Set(pages)].sort((a, b) => a - b);
    }
});

// Legacy function aliases for backward compatibility
window.updateStatus = window.UI.updateStatus;
window.updateProgress = window.UI.updateProgress;
window.showProgress = window.UI.showProgress;
window.hideProgress = window.UI.hideProgress;
window.addLog = window.UI.addLog;
window.clearLogs = window.UI.clearLogs;
window.showToast = window.UI.showToast;
window.handleError = window.UI.handleError;
window.setLoadingState = window.UI.setLoadingState;
window.handleSuccess = window.UI.handleSuccess;
window.validatePagesFormat = window.UI.validatePagesFormat;
window.parsePagesInput = window.UI.parsePagesInput;

// Theme management (separate function)
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');

    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        themeIcon.className = 'fas fa-moon text-gray-600';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark');
        themeIcon.className = 'fas fa-sun text-yellow-500';
        localStorage.setItem('theme', 'dark');
    }
}