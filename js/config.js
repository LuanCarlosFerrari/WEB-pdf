// Configuration and namespace management
window.UI = {
    // Toast notifications
    showToast: function(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`Toast: ${message} (${type})`);
        }
    },

    // Log management
    addLog: function(message) {
        if (typeof addLog === 'function') {
            addLog(message);
        } else {
            console.log(`Log: ${message}`);
        }
    },

    // Clear logs
    clearLogs: function() {
        if (typeof clearLogs === 'function') {
            clearLogs();
        } else {
            const logContent = document.getElementById('log-content');
            if (logContent) {
                logContent.innerHTML = '<div class="log-entry info">Log limpo</div>';
            }
        }
    },

    // Progress management
    showProgress: function(operation) {
        if (typeof showProgress === 'function') {
            showProgress(operation);
        } else {
            const progressContainer = document.getElementById('progress-container');
            if (progressContainer) {
                progressContainer.classList.add('show');
            }
        }
    },

    hideProgress: function(operation) {
        if (typeof hideProgress === 'function') {
            hideProgress(operation);
        } else {
            const progressContainer = document.getElementById('progress-container');
            if (progressContainer) {
                progressContainer.classList.remove('show');
            }
        }
    },

    updateProgress: function(percentage, message) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressPercentage = document.getElementById('progress-percentage');

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        if (progressText && message) {
            progressText.textContent = message;
        }
        if (progressPercentage) {
            progressPercentage.textContent = `${percentage}%`;
        }
    }
};

// Global configuration
window.PDFConfig = {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['application/pdf'],
    allowedExtensions: ['.pdf']
};

// Compatibility functions for legacy code
function switchTab(tabName) {
    if (window.switchTabOriginal) {
        window.switchTabOriginal(tabName);
    } else {
        // Fallback implementation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');

        window.currentTab = tabName;
        UI.addLog(`Aba alterada para: ${tabName}`);
    }
}

// Initialize global variables
window.currentTab = 'rename';
window.uploadedFiles = [];
window.isProcessing = false;
