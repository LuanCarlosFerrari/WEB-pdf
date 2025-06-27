// Core functionality and shared utilities
let currentTab = 'rename';
let uploadedFiles = [];
let isProcessing = false;

// CORE namespace for module compatibility
window.CORE = {
    getUploadedFiles: function () {
        return uploadedFiles || [];
    },

    setUploadedFiles: function (files) {
        uploadedFiles = files;
        // Dispatch event for modules
        document.dispatchEvent(new CustomEvent('filesUploaded', { detail: files }));
    },

    getCurrentTab: function () {
        return currentTab;
    },

    isProcessing: function () {
        return isProcessing;
    },

    setProcessing: function (processing) {
        isProcessing = processing;
    }
};

// Tab switching functionality
function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }

    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    }

    currentTab = tabName;

    // Clear any previous uploads for single-file operations
    if (['split', 'extract', 'watermark', 'excel'].includes(tabName)) {
        clearSingleFileUpload(tabName);
    }

    if (typeof addLog === 'function') {
        addLog(`📝 Aba alterada para: ${getTabName(tabName)}`);
    }
}

// Store original for compatibility
window.switchTabOriginal = switchTab;

function getTabName(tabName) {
    const names = {
        rename: 'Renomear',
        split: 'Dividir',
        merge: 'Mesclar',
        extract: 'Extrair',
        watermark: 'Marca d\'Água',
        excel: 'Excel'
    };
    return names[tabName] || tabName;
}

function initializeTabSwitching() {
    // Already handled by HTML onclick
}

// Drag and drop functionality
function initializeDragAndDrop() {
    // Main drop zone
    const mainDropZone = document.getElementById('drop-zone');
    if (mainDropZone) {
        mainDropZone.addEventListener('dragover', handleDragOver);
        mainDropZone.addEventListener('dragleave', handleDragLeave);
        mainDropZone.addEventListener('drop', handleDrop);
        mainDropZone.addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
    }

    // Other drop zones (if any)
    const dropZones = document.querySelectorAll('.file-drop-zone');
    dropZones.forEach(zone => {
        if (zone.id === 'drop-zone') return; // Skip main zone, already handled

        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('click', () => {
            const zoneId = zone.id;
            if (zoneId.includes('rename')) {
                document.getElementById('files-rename').click();
            } else if (zoneId.includes('merge')) {
                document.getElementById('files-merge').click();
            } else if (zoneId.includes('split')) {
                document.getElementById('file-split').click();
            } else if (zoneId.includes('extract')) {
                document.getElementById('file-extract').click();
            } else if (zoneId.includes('watermark')) {
                document.getElementById('file-watermark').click();
            } else if (zoneId.includes('excel')) {
                document.getElementById('file-excel').click();
            }
        });
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    const zoneId = e.currentTarget.id;

    if (files.length === 0) return;

    // Filter only PDF files
    const pdfFiles = files.filter(file =>
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Nenhum arquivo PDF válido encontrado', 'error');
        } else if (typeof showToast === 'function') {
            showToast('Nenhum arquivo PDF válido encontrado', 'error');
        }
        return;
    }

    // Handle main drop zone
    if (zoneId === 'drop-zone' || !zoneId) {
        displayMainFileList(pdfFiles);
        routeFilesToCurrentTab(pdfFiles);
        return;
    }

    // Handle specific drop zones
    if (zoneId === 'drop-zone-rename' || zoneId === 'drop-zone-merge') {
        handleMultipleFiles(pdfFiles, zoneId.includes('rename') ? 'rename' : 'merge');
    } else {
        if (pdfFiles.length > 1) {
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('Selecione apenas um arquivo para esta operação', 'warning');
            } else if (typeof showToast === 'function') {
                showToast('Selecione apenas um arquivo para esta operação', 'warning');
            }
            return;
        }
        handleSingleFile(pdfFiles[0], zoneId.replace('drop-zone-', ''));
    }
}

// File input initialization
function initializeFileInputs() {
    // Main file input (general upload)
    const mainFileInput = document.getElementById('file-input');
    if (mainFileInput) {
        mainFileInput.addEventListener('change', (e) => {
            console.log('Main file input changed:', e.target.files.length);
            if (e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                console.log('Files selected:', files.map(f => f.name));
                // Show files in general file list and route to current tab
                displayMainFileList(files);
                routeFilesToCurrentTab(files);
            }
        });
    } else {
        console.warn('Main file input not found');
    }

    // Multiple file inputs
    const renameInput = document.getElementById('files-rename');
    if (renameInput) {
        renameInput.addEventListener('change', (e) => {
            handleMultipleFiles(Array.from(e.target.files), 'rename');
        });
    }

    const mergeInput = document.getElementById('files-merge');
    if (mergeInput) {
        mergeInput.addEventListener('change', (e) => {
            handleMultipleFiles(Array.from(e.target.files), 'merge');
        });
    }

    // Single file inputs
    ['split', 'extract', 'watermark', 'excel'].forEach(operation => {
        const input = document.getElementById(`file-${operation}`);
        if (input) {
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleSingleFile(e.target.files[0], operation);
                }
            });
        }
    });
}

// Display main file list in general upload area
function displayMainFileList(files) {
    console.log('displayMainFileList called with:', files.length, 'files');
    const container = document.getElementById('file-list');
    if (!container) {
        console.error('file-list container not found');
        return;
    }

    container.innerHTML = '';

    if (files.length === 0) return;

    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-2';
        fileItem.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas fa-file-pdf text-red-500 text-xl"></i>
                <div>
                    <p class="font-medium text-gray-800">${file.name}</p>
                    <p class="text-sm text-gray-500">${formatFileSize(file.size)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">PDF</span>
                <button onclick="removeMainFile(${index})" 
                        class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        container.appendChild(fileItem);
    });

    // Add info message
    const infoDiv = document.createElement('div');
    infoDiv.className = 'mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg';
    infoDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-info-circle text-blue-500 mr-2"></i>
            <p class="text-sm text-blue-700">
                ${files.length} arquivo(s) carregado(s). Use as abas acima para escolher a operação desejada.
            </p>
        </div>
    `;
    container.appendChild(infoDiv);
}

// Route files to current tab operation
function routeFilesToCurrentTab(files) {
    // Store files globally
    uploadedFiles = files;
    CORE.setUploadedFiles(files);

    // Route based on current tab
    if (currentTab === 'rename' || currentTab === 'merge') {
        // Multiple file operations
        handleMultipleFiles(files, currentTab);
    } else if (['split', 'extract', 'watermark', 'excel'].includes(currentTab)) {
        // Single file operations - use first file
        if (files.length > 0) {
            handleSingleFile(files[0], currentTab);
            if (files.length > 1) {
                UI.showToast(`Apenas o primeiro arquivo será usado para ${getTabName(currentTab)}`, 'warning');
            }
        }
    }
}

// Handle multiple files upload
function handleMultipleFiles(files, operation) {
    if (isProcessing) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Aguarde o processamento atual terminar', 'warning');
        }
        return;
    }

    const validFiles = files.filter(file =>
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (validFiles.length === 0) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Nenhum arquivo PDF válido selecionado', 'error');
        }
        return;
    }

    if (operation === 'merge' && validFiles.length < 2) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Selecione pelo menos 2 arquivos para mesclar', 'warning');
        }
        return;
    }

    uploadedFiles = validFiles;
    CORE.setUploadedFiles(validFiles);
    displayFileList(validFiles, operation);

    // Enable process button
    const processBtn = document.getElementById(`${operation === 'rename' ? 'process-rename-files' : 'merge-pdfs'}`);
    if (processBtn) {
        processBtn.disabled = false;
    }

    if (typeof UI !== 'undefined' && UI.addLog) {
        UI.addLog(`📁 ${validFiles.length} arquivo(s) PDF selecionado(s) para ${getTabName(operation)}`);
    }
    if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(`${validFiles.length} arquivo(s) carregado(s) com sucesso`, 'success');
    }
}

// Handle single file upload
function handleSingleFile(file, operation) {
    if (isProcessing) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Aguarde o processamento atual terminar', 'warning');
        }
        return;
    }

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Por favor, selecione um arquivo PDF', 'error');
        }
        return;
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast('Arquivo muito grande. Máximo 100MB', 'error');
        }
        return;
    }

    // Display file info
    displaySingleFileInfo(file, operation);

    // Enable controls
    enableOperationControls(operation);

    if (typeof UI !== 'undefined' && UI.addLog) {
        UI.addLog(`📄 Arquivo selecionado: ${file.name} (${formatFileSize(file.size)})`);
    }
    if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('Arquivo carregado com sucesso', 'success');
    }
}

// Display file list for multiple files
function displayFileList(files, operation) {
    const containerId = operation === 'rename' ? 'file-list-rename' : 'merge-file-list';
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center justify-between bg-gray-50 rounded-lg p-3 border';
        fileItem.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas fa-file-pdf text-red-500"></i>
                <div>
                    <p class="font-medium text-gray-800">${file.name}</p>
                    <p class="text-sm text-gray-500">${formatFileSize(file.size)}</p>
                </div>
            </div>
            <button onclick="removeFile(${index}, '${operation}')" 
                    class="text-red-500 hover:text-red-700 p-1">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(fileItem);
    });
}

// Display single file info
function displaySingleFileInfo(file, operation) {
    const infoContainer = document.getElementById(`${operation}-file-info`);
    if (!infoContainer) return;

    infoContainer.className = infoContainer.className.replace('hidden', '');
    infoContainer.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <i class="fas fa-file-pdf text-red-500 text-2xl"></i>
                <div>
                    <p class="font-medium text-gray-800">${file.name}</p>
                    <p class="text-sm text-gray-500">${formatFileSize(file.size)}</p>
                </div>
            </div>
            <button onclick="clearSingleFileUpload('${operation}')" 
                    class="text-red-500 hover:text-red-700 p-2">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Store file reference
    infoContainer.dataset.fileName = file.name;
    infoContainer.fileData = file;
}

// Enable operation controls
function enableOperationControls(operation) {
    // Map operation names to actual button IDs
    const buttonMap = {
        'split': 'split-pdfs',
        'extract': 'extract-pages',
        'watermark': 'add-watermark',
        'excel': 'convert-to-excel'
    };

    const buttonId = buttonMap[operation] || `${operation}-btn`;
    const button = document.getElementById(buttonId);
    if (button) button.disabled = false;

    // Enable specific inputs
    if (operation === 'extract') {
        const pagesInput = document.getElementById('pages-input');
        if (pagesInput) pagesInput.disabled = false;
    } else if (operation === 'watermark') {
        const watermarkText = document.getElementById('watermark-text');
        if (watermarkText) watermarkText.disabled = false;
    }
}

// Clear single file upload
function clearSingleFileUpload(operation) {
    const infoContainer = document.getElementById(`${operation}-file-info`);
    if (infoContainer) {
        infoContainer.classList.add('hidden');
        infoContainer.innerHTML = '';
        delete infoContainer.fileData;
    }

    const fileInput = document.getElementById(`file-${operation}`);
    if (fileInput) fileInput.value = '';

    // Map operation names to actual button IDs
    const buttonMap = {
        'split': 'split-pdfs',
        'extract': 'extract-pages',
        'watermark': 'add-watermark',
        'excel': 'convert-to-excel'
    };

    const buttonId = buttonMap[operation] || `${operation}-btn`;
    const button = document.getElementById(buttonId);
    if (button) button.disabled = true;

    // Disable specific inputs
    if (operation === 'extract') {
        const pagesInput = document.getElementById('pages-input');
        if (pagesInput) {
            pagesInput.disabled = true;
            pagesInput.value = '';
        }
    } else if (operation === 'watermark') {
        const watermarkText = document.getElementById('watermark-text');
        if (watermarkText) {
            watermarkText.disabled = true;
            watermarkText.value = '';
        }
    }
}

// Remove file from list
function removeFile(index, operation) {
    uploadedFiles.splice(index, 1);
    displayFileList(uploadedFiles, operation);

    if (uploadedFiles.length === 0) {
        const processBtn = document.getElementById(`${operation === 'rename' ? 'process-rename-files' : 'merge-pdfs'}`);
        if (processBtn) processBtn.disabled = true;
    }

    if (operation === 'merge' && uploadedFiles.length < 2) {
        const mergeBtn = document.getElementById('merge-pdfs');
        if (mergeBtn) mergeBtn.disabled = true;
        if (typeof showToast === 'function') {
            showToast('Mínimo 2 arquivos necessários para mesclar', 'warning');
        }
    }

    addLog(`🗑️ Arquivo removido: ${index + 1}`);
}

// Remove file from main list
function removeMainFile(index) {
    uploadedFiles.splice(index, 1);
    CORE.setUploadedFiles(uploadedFiles);
    displayMainFileList(uploadedFiles);

    // Update current tab if needed
    if (uploadedFiles.length === 0) {
        // Clear all tab-specific displays
        const containers = ['file-list-rename', 'merge-file-list'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = '';
        });

        // Clear single file displays
        ['split', 'extract', 'watermark', 'excel'].forEach(operation => {
            clearSingleFileUpload(operation);
        });
    } else {
        // Re-route remaining files
        routeFilesToCurrentTab(uploadedFiles);
    }

    if (typeof addLog === 'function') {
        addLog(`🗑️ Arquivo removido: ${index + 1}`);
    }
}

// Global callback functions for module compatibility
function processRenameFiles() {
    if (window.pdfRenamer && typeof window.pdfRenamer.processRenameFiles === 'function') {
        window.pdfRenamer.processRenameFiles();
    } else {
        UI.showToast('Módulo de renomeação não carregado', 'error');
    }
}

function processSplitPDF() {
    if (window.pdfSplitter && typeof window.pdfSplitter.splitPDFs === 'function') {
        window.pdfSplitter.splitPDFs();
    } else {
        UI.showToast('Módulo de divisão não carregado', 'error');
    }
}

function processMergePDFs() {
    if (window.pdfMerger && typeof window.pdfMerger.mergePDFs === 'function') {
        window.pdfMerger.mergePDFs();
    } else {
        UI.showToast('Módulo de mesclagem não carregado', 'error');
    }
}

function processExtractPages() {
    if (window.pdfExtractor && typeof window.pdfExtractor.extractPages === 'function') {
        window.pdfExtractor.extractPages();
    } else {
        UI.showToast('Módulo de extração não carregado', 'error');
    }
}

function processAddWatermark() {
    if (window.pdfWatermarker && typeof window.pdfWatermarker.addWatermarkToPDFs === 'function') {
        window.pdfWatermarker.addWatermarkToPDFs();
    } else {
        UI.showToast('Módulo de marca d\'água não carregado', 'error');
    }
}

function processConvertToExcel() {
    if (window.pdfToExcelConverter && typeof window.pdfToExcelConverter.convertToExcel === 'function') {
        window.pdfToExcelConverter.convertToExcel();
    } else {
        UI.showToast('Módulo de conversão Excel não carregado', 'error');
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// PDF reading utility
async function readPDFFile(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        return pdfDoc;
    } catch (error) {
        console.error('Erro ao ler PDF:', error);
        throw new Error('Erro ao ler arquivo PDF');
    }
}

// Download utility
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'Enter') {
        // Map operation names to actual button IDs for checks
        const buttonMap = {
            'rename': 'process-rename-files',
            'split': 'split-pdfs',
            'merge': 'merge-pdfs',
            'extract': 'extract-pages',
            'watermark': 'add-watermark',
            'excel': 'convert-to-excel'
        };

        const buttonId = buttonMap[currentTab];
        const button = document.getElementById(buttonId);

        if (button && !button.disabled) {
            if (currentTab === 'rename') {
                processRenameFiles();
            } else if (currentTab === 'split') {
                processSplitPDF();
            } else if (currentTab === 'merge') {
                processMergePDFs();
            } else if (currentTab === 'extract') {
                processExtractPages();
            } else if (currentTab === 'watermark') {
                processAddWatermark();
            } else if (currentTab === 'excel') {
                processConvertToExcel();
            }
        }
    }

    if (e.key === 'Escape') {
        if (typeof closeDownloadModal === 'function') closeDownloadModal();
        if (typeof closeHelp === 'function') closeHelp();
    }

    // Tab switching with Ctrl+Number
    if (e.ctrlKey && e.key >= '1' && e.key <= '6') {
        const tabs = ['rename', 'split', 'merge', 'extract', 'watermark', 'excel'];
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
            switchTab(tabs[tabIndex]);
        }
    }

    if (e.key === 'F1') {
        e.preventDefault();
        if (typeof showHelp === 'function') showHelp();
    }
});

// Debug functions for testing (remove in production)
window.debugUpload = {
    test: function () {
        console.log('=== DEBUG UPLOAD TEST ===');

        console.log('Checking elements:');
        const fileInput = document.getElementById('file-input');
        const dropZone = document.getElementById('drop-zone');
        const fileList = document.getElementById('file-list');

        console.log('file-input:', fileInput);
        console.log('drop-zone:', dropZone);
        console.log('file-list:', fileList);

        console.log('Checking functions:');
        console.log('displayMainFileList:', typeof displayMainFileList);
        console.log('routeFilesToCurrentTab:', typeof routeFilesToCurrentTab);
        console.log('formatFileSize:', typeof formatFileSize);
        console.log('UI object:', typeof UI);

        if (fileInput) {
            console.log('Testing file input click...');
            fileInput.click();
        }

        return 'Debug complete - check console for results';
    },

    simulateFileUpload: function () {
        console.log('Simulating file upload...');
        // Create a fake file for testing
        const fakeFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        displayMainFileList([fakeFile]);
        routeFilesToCurrentTab([fakeFile]);
        return 'Fake file uploaded';
    }
};

console.log('Debug functions available: window.debugUpload.test() and window.debugUpload.simulateFileUpload()');
