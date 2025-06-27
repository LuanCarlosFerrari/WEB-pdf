// Configuration and namespace management
window.CONFIG = {
    // UI Classes - Standardized design system
    BUTTON_CLASSES: {
        base: 'btn-base',
        primary: 'btn-base btn-primary',
        secondary: 'btn-base btn-secondary',
        danger: 'btn-base btn-danger',
        warning: 'btn-base btn-warning',
        gray: 'btn-base btn-gray',
        outline: 'btn-base btn-outline',
        sm: 'btn-sm',
        lg: 'btn-lg',
        iconOnly: 'btn-icon-only'
    },

    INPUT_CLASSES: {
        base: 'input-base',
        error: 'input-base input-error',
        disabled: 'input-base disabled:bg-gray-100'
    },

    SELECT_CLASSES: {
        base: 'select-base'
    },

    CARD_CLASSES: {
        base: 'card-base',
        hover: 'card-base card-hover'
    },

    MODAL_CLASSES: {
        backdrop: 'modal',
        content: 'modal-content'
    },

    TOAST_CLASSES: {
        base: 'toast',
        success: 'toast success',
        error: 'toast error',
        warning: 'toast warning',
        info: 'toast info'
    },

    LOG_CLASSES: {
        base: 'log-entry',
        info: 'log-entry info',
        success: 'log-entry success',
        warning: 'log-entry warning',
        error: 'log-entry error'
    },

    FILE_CLASSES: {
        item: 'file-item',
        number: 'file-number',
        name: 'file-name',
        size: 'file-size',
        status: 'file-status'
    },

    PROGRESS_CLASSES: {
        container: 'progress-container',
        track: 'progress-track',
        bar: 'progress-bar'
    },

    ANIMATIONS: {
        fadeIn: 'animate-fade-in',
        slideIn: 'animate-slide-in',
        spin: 'animate-spin'
    },

    // Theme colors
    COLORS: {
        primary: '#3b82f6',
        secondary: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        success: '#10b981',
        gray: '#6b7280'
    },

    // File processing settings
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_EXTENSIONS: ['.pdf'],
    BATCH_SIZE: 10,

    // Toast settings
    TOAST_DURATION: 4000,
    TOAST_ANIMATION_DURATION: 300
};

// Extend UI namespace if it exists, otherwise create it
if (!window.UI) {
    window.UI = {};
}

// Add additional UI functions to the namespace  
Object.assign(window.UI, {
    // Log management with standardized styling
    addLog: function (message, type = 'info') {
        const logContent = document.getElementById('log-content');
        if (!logContent) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = CONFIG.LOG_CLASSES[type] || CONFIG.LOG_CLASSES.base;

        // Add appropriate icon based on type
        const icons = {
            info: '💡',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        const icon = icons[type] || '📝';
        logEntry.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${icon} ${message}`;

        logContent.appendChild(logEntry);
        logEntry.classList.add(CONFIG.ANIMATIONS.fadeIn);
        logContent.scrollTop = logContent.scrollHeight;
    },

    // Clear logs
    clearLogs: function () {
        const logContent = document.getElementById('log-content');
        if (logContent) {
            logContent.innerHTML = '';
            this.addLog('Log limpo', 'info');
        }
    },

    // Progress management with standardized styling
    showProgress: function (operation) {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.classList.add('show');
            progressContainer.classList.add(CONFIG.ANIMATIONS.fadeIn);
        }
    },

    hideProgress: function (operation) {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.classList.remove('show');
        }
        // Reset progress
        this.updateProgress(0, '');
    },

    updateProgress: function (percentage, message) {
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
            progressPercentage.textContent = `${Math.round(percentage)}%`;
        }
    },

    // Create standardized buttons
    createButton: function (text, icon, type = 'primary', size = '', onClick = null) {
        const button = document.createElement('button');
        const sizeClass = size ? ` ${CONFIG.BUTTON_CLASSES[size]}` : '';
        button.className = CONFIG.BUTTON_CLASSES[type] + sizeClass;

        if (icon) {
            button.innerHTML = `<i class="fas fa-${icon} mr-2"></i>${text}`;
        } else {
            button.textContent = text;
        }

        if (onClick) {
            button.addEventListener('click', onClick);
        }

        return button;
    },

    // Create standardized input
    createInput: function (type = 'text', placeholder = '', required = false) {
        const input = document.createElement('input');
        input.type = type;
        input.className = CONFIG.INPUT_CLASSES.base;
        input.placeholder = placeholder;
        input.required = required;
        return input;
    },

    // Create standardized file item
    createFileItem: function (file, index) {
        const item = document.createElement('div');
        item.className = CONFIG.FILE_CLASSES.item;
        item.classList.add(CONFIG.ANIMATIONS.fadeIn);

        const fileSize = this.formatFileSize(file.size);

        item.innerHTML = `
            <div class="flex items-center">
                <div class="${CONFIG.FILE_CLASSES.number}">${index + 1}</div>
                <div class="${CONFIG.FILE_CLASSES.name}">${file.name}</div>
            </div>
            <div class="${CONFIG.FILE_CLASSES.size}">${fileSize}</div>
        `;

        return item;
    },

    // Utility functions
    formatFileSize: function (bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Error handling with standardized styling
    handleError: function (operation, error) {
        console.error(`Erro em ${operation}:`, error);
        this.addLog(`Erro em ${operation}: ${error.message}`, 'error');
        this.showToast(`Erro: ${error.message}`, 'error');
        this.hideProgress(operation);

        // Re-enable buttons
        const buttons = document.querySelectorAll('button:disabled');
        buttons.forEach(btn => btn.disabled = false);
    },

    // Success handling with standardized styling
    handleSuccess: function (operation, message, downloadCallback) {
        this.addLog(message, 'success');
        this.showToast(message, 'success');
        this.hideProgress(operation);

        if (downloadCallback) {
            this.showDownloadModal(message, downloadCallback);
        }
    },

    // Loading states with standardized styling
    setLoadingState: function (buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (loading) {
            button.disabled = true;
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = icon.className.replace(/fa-[\w-]+/, 'fa-spinner');
                icon.classList.add(CONFIG.ANIMATIONS.spin);
            }
        } else {
            button.disabled = false;
            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.remove(CONFIG.ANIMATIONS.spin);
                // Restore original icon based on button context
                this.restoreButtonIcon(button);
            }
        }
    },

    restoreButtonIcon: function (button) {
        const iconMap = {
            'process-rename-files': 'fa-play',
            'split-pdfs': 'fa-cut',
            'merge-pdfs': 'fa-layer-group',
            'extract-pages': 'fa-scissors',
            'add-watermark': 'fa-stamp',
            'convert-to-excel': 'fa-file-excel'
        };

        const icon = button.querySelector('i');
        if (icon && iconMap[button.id]) {
            icon.className = `fas ${iconMap[button.id]} mr-2`;
        }
    },

    // Modal management
    showModal: function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.classList.add(CONFIG.ANIMATIONS.fadeIn);
        }
    },

    hideModal: function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    },

    // Progress management
    showProgress: function () {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.classList.add('show');
        }
    },

    hideProgress: function () {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.classList.remove('show');
        }
    },

    updateProgress: function (percentage, message) {
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
});

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
