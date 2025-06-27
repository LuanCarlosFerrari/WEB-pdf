// Main initialization script
document.addEventListener('DOMContentLoaded', function () {
    console.log('=== PDF Processor Initialization Started ===');

    // Initialize core functions first
    console.log('Initializing core functions...');
    try {
        console.log('Initializing drag and drop...');
        if (typeof initializeDragAndDrop === 'function') {
            initializeDragAndDrop();
            console.log('✅ Drag and drop initialized');
        } else {
            console.warn('❌ initializeDragAndDrop function not found');
        }

        console.log('Initializing file inputs...');
        if (typeof initializeFileInputs === 'function') {
            initializeFileInputs();
            console.log('✅ File inputs initialized');
        } else {
            console.warn('❌ initializeFileInputs function not found');
        }

        console.log('Initializing tab switching...');
        if (typeof initializeTabSwitching === 'function') {
            initializeTabSwitching();
            console.log('✅ Tab switching initialized');
        }

        // Show initial status
        if (typeof UI !== 'undefined' && UI.updateStatus) {
            UI.updateStatus('Pronto para processar', 'success');
        }
        if (typeof UI !== 'undefined' && UI.addLog) {
            UI.addLog('🚀 Sistema funcional iniciado');
        }

    } catch (error) {
        console.error('❌ Erro ao inicializar funções básicas:', error);
    }

    // Initialize all modules
    try {
        console.log('Initializing PDF modules...');

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

        if (typeof UI !== 'undefined') {
            UI.addLog('✅ Todos os módulos carregados com sucesso');
            UI.showToast('Sistema iniciado com sucesso!', 'success');
        }
        console.log('✅ All modules initialized');

    } catch (error) {
        console.error('❌ Erro ao inicializar módulos:', error);
        if (typeof UI !== 'undefined') {
            UI.addLog('❌ Erro ao carregar módulos: ' + error.message);
            UI.showToast('Erro ao inicializar sistema', 'error');
        }
    }

    // Add event listeners for clear logs button
    const clearLogsBtn = document.getElementById('clear-logs');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', function () {
            if (typeof UI !== 'undefined' && UI.clearLogs) {
                UI.clearLogs();
            }
        });
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

    console.log('=== PDF Processor Initialization Complete ===');
});
