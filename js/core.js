// Core functionality and shared utilities
let currentTab = 'rename';
let uploadedFiles = [];
let isProcessing = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeDragAndDrop();
    initializeFileInputs();
    initializeTabSwitching();

    // Show initial status
    updateStatus('Pronto para processar', 'success');
    addLog('🚀 Sistema funcional iniciado');

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        toggleTheme();
    }
});

// Tab switching functionality
function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    currentTab = tabName;

    // Clear any previous uploads for single-file operations
    if (['split', 'extract', 'watermark', 'excel'].includes(tabName)) {
        clearSingleFileUpload(tabName);
    }

    addLog(`📝 Aba alterada para: ${getTabName(tabName)}`);
}

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
    const dropZones = document.querySelectorAll('.file-drop-zone');

    dropZones.forEach(zone => {
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

    // Handle different drop zones
    if (zoneId === 'drop-zone-rename' || zoneId === 'drop-zone-merge') {
        handleMultipleFiles(files, zoneId.includes('rename') ? 'rename' : 'merge');
    } else {
        if (files.length > 1) {
            showToast('Selecione apenas um arquivo para esta operação', 'warning');
            return;
        }
        handleSingleFile(files[0], zoneId.replace('drop-zone-', ''));
    }
}

// File input initialization
function initializeFileInputs() {
    // Multiple file inputs
    document.getElementById('files-rename').addEventListener('change', (e) => {
        handleMultipleFiles(Array.from(e.target.files), 'rename');
    });

    document.getElementById('files-merge').addEventListener('change', (e) => {
        handleMultipleFiles(Array.from(e.target.files), 'merge');
    });

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

// Handle multiple files upload
function handleMultipleFiles(files, operation) {
    if (isProcessing) {
        showToast('Aguarde o processamento atual terminar', 'warning');
        return;
    }

    const validFiles = files.filter(file =>
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (validFiles.length === 0) {
        showToast('Nenhum arquivo PDF válido selecionado', 'error');
        return;
    }

    if (operation === 'merge' && validFiles.length < 2) {
        showToast('Selecione pelo menos 2 arquivos para mesclar', 'warning');
        return;
    }

    uploadedFiles = validFiles;
    displayFileList(validFiles, operation);

    // Enable process button
    const processBtn = document.getElementById(`${operation === 'rename' ? 'process-btn-rename' : 'merge-btn'}`);
    if (processBtn) {
        processBtn.disabled = false;
    }

    addLog(`📁 ${validFiles.length} arquivo(s) PDF selecionado(s) para ${getTabName(operation)}`);
    showToast(`${validFiles.length} arquivo(s) carregado(s) com sucesso`, 'success');
}

// Handle single file upload
function handleSingleFile(file, operation) {
    if (isProcessing) {
        showToast('Aguarde o processamento atual terminar', 'warning');
        return;
    }

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Por favor, selecione um arquivo PDF', 'error');
        return;
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
        showToast('Arquivo muito grande. Máximo 100MB', 'error');
        return;
    }

    // Display file info
    displaySingleFileInfo(file, operation);

    // Enable controls
    enableOperationControls(operation);

    addLog(`📄 Arquivo selecionado: ${file.name} (${formatFileSize(file.size)})`);
    showToast('Arquivo carregado com sucesso', 'success');
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
    const button = document.getElementById(`${operation}-btn`);
    if (button) button.disabled = false;

    // Enable specific inputs
    if (operation === 'extract') {
        document.getElementById('pages-input').disabled = false;
    } else if (operation === 'watermark') {
        document.getElementById('watermark-text').disabled = false;
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

    const button = document.getElementById(`${operation}-btn`);
    if (button) button.disabled = true;

    // Disable specific inputs
    if (operation === 'extract') {
        document.getElementById('pages-input').disabled = true;
        document.getElementById('pages-input').value = '';
    } else if (operation === 'watermark') {
        document.getElementById('watermark-text').disabled = true;
        document.getElementById('watermark-text').value = '';
    }
}

// Remove file from list
function removeFile(index, operation) {
    uploadedFiles.splice(index, 1);
    displayFileList(uploadedFiles, operation);

    if (uploadedFiles.length === 0) {
        const processBtn = document.getElementById(`${operation === 'rename' ? 'process-btn-rename' : 'merge-btn'}`);
        if (processBtn) processBtn.disabled = true;
    }

    if (operation === 'merge' && uploadedFiles.length < 2) {
        const mergeBtn = document.getElementById('merge-btn');
        if (mergeBtn) mergeBtn.disabled = true;
        showToast('Mínimo 2 arquivos necessários para mesclar', 'warning');
    }

    addLog(`🗑️ Arquivo removido: ${index + 1}`);
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
        if (currentTab === 'rename' && !document.getElementById('process-btn-rename').disabled) {
            processRenameFiles();
        } else if (currentTab === 'split' && !document.getElementById('split-btn').disabled) {
            processSplitPDF();
        } else if (currentTab === 'merge' && !document.getElementById('merge-btn').disabled) {
            processMergePDFs();
        } else if (currentTab === 'extract' && !document.getElementById('extract-btn').disabled) {
            processExtractPages();
        } else if (currentTab === 'watermark' && !document.getElementById('watermark-btn').disabled) {
            processAddWatermark();
        } else if (currentTab === 'excel' && !document.getElementById('excel-btn').disabled) {
            processConvertToExcel();
        }
    }

    if (e.key === 'Escape') {
        closeDownloadModal();
        closeHelp();
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
        showHelp();
    }
});
