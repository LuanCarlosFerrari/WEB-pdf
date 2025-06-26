// UI management functions

// Theme management
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

// Status management
function updateStatus(message, type) {
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
    }
}

// Progress management
function updateProgress(operation, percentage, message) {
    const progressBar = document.getElementById(`progress-bar-${operation}`);
    const progressText = document.getElementById(`progress-text-${operation}`);

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    if (progressText && message) {
        progressText.textContent = message;
    }
}

function showProgress(operation) {
    const progressContainer = document.getElementById(`${operation}-progress`);
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
    }
}

function hideProgress(operation) {
    const progressContainer = document.getElementById(`${operation}-progress`);
    if (progressContainer) {
        progressContainer.classList.add('hidden');
    }

    // Reset progress
    updateProgress(operation, 0, '');
}

// Log management
function addLog(message) {
    const logContainer = document.getElementById('log-content');
    if (!logContainer) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'text-xs opacity-80';
    logEntry.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${message}`;

    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function clearLogs() {
    const logContainer = document.getElementById('log-content');
    if (logContainer) {
        logContainer.innerHTML = '';
        addLog('🧹 Log limpo');
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast bg-white border-l-4 rounded-lg shadow-lg p-4 mb-2 max-w-sm ${type === 'success' ? 'border-green-500' :
        type === 'error' ? 'border-red-500' :
            type === 'warning' ? 'border-yellow-500' :
                'border-blue-500'
        }`;

    const icon = {
        success: 'fas fa-check-circle text-green-500',
        error: 'fas fa-exclamation-circle text-red-500',
        warning: 'fas fa-exclamation-triangle text-yellow-500',
        info: 'fas fa-info-circle text-blue-500'
    }[type];

    toast.innerHTML = `
        <div class="flex items-center">
            <i class="${icon} mr-3"></i>
            <p class="text-gray-800 text-sm">${message}</p>
        </div>
    `;

    container.appendChild(toast);

    // Animate in
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
}

// Download modal
function showDownloadModal(message, downloadCallback) {
    const modal = document.getElementById('download-modal');
    const messageEl = document.getElementById('download-message');
    const downloadBtn = document.getElementById('download-btn');

    if (modal && messageEl && downloadBtn) {
        messageEl.textContent = message;
        downloadBtn.onclick = downloadCallback;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeDownloadModal() {
    const modal = document.getElementById('download-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Help modal
function showHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Error handling
function handleError(operation, error) {
    console.error(`Erro em ${operation}:`, error);
    addLog(`❌ Erro em ${operation}: ${error.message}`);
    showToast(`Erro: ${error.message}`, 'error');
    updateStatus('Erro no processamento', 'error');
    hideProgress(operation);
    isProcessing = false;

    // Re-enable buttons
    const buttons = document.querySelectorAll('button[id$="-btn"]');
    buttons.forEach(btn => {
        if (!btn.id.includes('process') || uploadedFiles.length > 0) {
            btn.disabled = false;
        }
    });
}

// Loading states
function setLoadingState(operation, loading) {
    // Map operation names to actual button IDs
    const buttonMap = {
        'rename': 'process-rename-files',
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
            if (operation === 'rename') button.innerHTML = '<i class="fas fa-play mr-2"></i>Processar Renomeação';
            else if (operation === 'split') button.innerHTML = '<i class="fas fa-cut mr-2"></i>Dividir PDFs';
            else if (operation === 'merge') button.innerHTML = '<i class="fas fa-layer-group mr-2"></i>Mesclar PDFs';
            else if (operation === 'extract') button.innerHTML = '<i class="fas fa-scissors mr-2"></i>Extrair Páginas';
            else if (operation === 'watermark') button.innerHTML = '<i class="fas fa-stamp mr-2"></i>Adicionar Marca d\'água';
            else if (operation === 'excel') button.innerHTML = '<i class="fas fa-file-excel mr-2"></i>Converter para Excel';
        }
    }
}

// Success handling
function handleSuccess(operation, message, downloadCallback) {
    addLog(`✅ ${message}`);
    showToast(message, 'success');
    updateStatus('Processamento concluído', 'success');
    hideProgress(operation);
    setLoadingState(operation, false);
    isProcessing = false;

    if (downloadCallback) {
        showDownloadModal(message, downloadCallback);
    }
}

// File validation
function validatePagesFormat(input) {
    const pattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
    return pattern.test(input.replace(/\s/g, ''));
}

function parsePagesInput(input) {
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
