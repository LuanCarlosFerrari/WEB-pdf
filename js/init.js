// Main initialization script
document.addEventListener('DOMContentLoaded', function () {
    // Initialize core functions first
    try {
        if (typeof initializeDragAndDrop === 'function') {
            initializeDragAndDrop();
        }

        if (typeof initializeFileInputs === 'function') {
            initializeFileInputs();
        }

        if (typeof initializeTabSwitching === 'function') {
            initializeTabSwitching();
        }

        // Show initial status
        if (typeof UI !== 'undefined' && UI.updateStatus) {
            UI.updateStatus('Pronto para processar', 'success');
        }

    } catch (error) {
        if (typeof UI !== 'undefined') {
            UI.addLog('❌ Erro ao inicializar sistema: ' + error.message, 'error');
        }
    }

    // Initialize all modules
    try {
        // Initialize PDF modules
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

        if (typeof UI !== 'undefined') {
            UI.addLog('✅ Sistema iniciado com sucesso', 'success');
            UI.showToast('Sistema iniciado com sucesso!', 'success');
        }

    } catch (error) {
        if (typeof UI !== 'undefined') {
            UI.addLog('❌ Erro ao carregar módulos: ' + error.message, 'error');
            UI.showToast('Erro ao inicializar sistema', 'error');
        }
    }

    // Set up tab switching (additional listeners)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab');
            if (tabName && typeof switchTab === 'function') {
                switchTab(tabName);
            }
        });
    });
});
