// Main initialization script
document.addEventListener('DOMContentLoaded', function () {
    // Initialize all modules
    try {
        // Initialize core functionality first
        if (typeof PDFRenamer !== 'undefined') {
            window.pdfRenamer = new PDFRenamer();
        }

        if (typeof PDFSplitter !== 'undefined') {
            window.pdfSplitter = new PDFSplitter();
        }

        if (typeof PDFMerger !== 'undefined') {
            window.pdfMerger = new PDFMerger();
        }

        if (typeof PDFExtractor !== 'undefined') {
            window.pdfExtractor = new PDFExtractor();
        }

        if (typeof PDFWatermarker !== 'undefined') {
            window.pdfWatermarker = new PDFWatermarker();
        }

        if (typeof PDFToExcelConverter !== 'undefined') {
            window.pdfToExcelConverter = new PDFToExcelConverter();
        }

        UI.addLog('✅ Todos os módulos carregados com sucesso');
        UI.showToast('Sistema iniciado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao inicializar módulos:', error);
        UI.addLog('❌ Erro ao carregar módulos: ' + error.message);
        UI.showToast('Erro ao inicializar sistema', 'error');
    }

    // Initialize drag and drop
    try {
        if (typeof initializeDragAndDrop === 'function') {
            initializeDragAndDrop();
        }

        if (typeof initializeFileInputs === 'function') {
            initializeFileInputs();
        }
    } catch (error) {
        console.error('Erro ao inicializar upload:', error);
    }

    // Add event listeners for clear logs button
    const clearLogsBtn = document.getElementById('clear-logs');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', UI.clearLogs);
    }

    // Set up tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        });
    });
});
