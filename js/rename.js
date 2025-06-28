// PDF Rename and Split Module - Multiple Files Support
class PDFRenamer {
    constructor() {
        console.log('🔧 Inicializando PDFRenamer com suporte a múltiplos arquivos...');
        this.currentFiles = []; // Changed from currentFile to support multiple files
        this.extractedData = []; // Will contain data for all files
        this.processedPages = [];
        this.templateManager = null;
        this.initializeRenameFeatures();
        console.log('✅ PDFRenamer inicializado com sucesso!');
    }

    async initializeRenameFeatures() {
        this.setupEventListeners();
        this.setupLayoutSelector();

        // Inicializar o gerenciador de templates
        try {
            this.templateManager = new TemplateManager();
            console.log('📋 Template Manager inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar Template Manager:', error);
        }
    }

    setupEventListeners() {
        const processBtn = document.getElementById('rename-process');
        const previewBtn = document.getElementById('rename-preview-btn');
        const downloadAllBtn = document.getElementById('rename-download-all');
        const layoutSelect = document.getElementById('rename-layout');

        if (processBtn) {
            processBtn.addEventListener('click', () => {
                console.log('🔄 Botão de processamento clicado - múltiplos arquivos');
                this.processAndRenameAllFiles();
            });
        }

        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                console.log('👁️ Botão de preview clicado - múltiplos arquivos');
                this.analyzeAllFiles();
            });
        }

        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => {
                console.log('📁 Botão de download organizado clicado');
                this.downloadOrganizedZip();
            });
        }



        if (layoutSelect) {
            layoutSelect.addEventListener('change', () => {
                this.updateLayoutOptions();
            });
        }

        // Atualizar preview quando arquivos forem carregados - múltiplos arquivos
        document.addEventListener('filesUploaded', () => {
            console.log('📁 Arquivos carregados - atualizando preview de renomeação para múltiplos arquivos');
            this.updateRenamePreviewMultiple();
        });
    }

    setupLayoutSelector() {
        this.updateLayoutOptions();
    }

    updateLayoutOptions() {
        const layout = document.getElementById('rename-layout')?.value;
        const itauOptions = document.getElementById('itau-options');
        const bradescoOptions = document.getElementById('bradesco-options');
        const customOptions = document.getElementById('custom-options');

        // Esconder todas as opções primeiro
        if (itauOptions) itauOptions.style.display = 'none';
        if (bradescoOptions) bradescoOptions.style.display = 'none';
        if (customOptions) customOptions.style.display = 'none';

        // Mostrar opções relevantes
        if (layout === 'itau' && itauOptions) {
            itauOptions.style.display = 'block';
        } else if (layout === 'bradesco' && bradescoOptions) {
            bradescoOptions.style.display = 'block';
        } else if (layout === 'custom' && customOptions) {
            customOptions.style.display = 'block';
        }

        console.log(`🏦 Layout selecionado: ${layout}`);
    }

    updateRenamePreviewMultiple() {
        const files = CORE.getUploadedFiles().filter(file => file.type === 'application/pdf');
        const preview = document.getElementById('rename-preview');
        const filesInfo = document.getElementById('rename-files-info');
        const filesList = document.getElementById('rename-files-list');

        if (files.length === 0) {
            if (preview) {
                preview.innerHTML = `
                    <div class="text-center text-gray-500">
                        <i class="fas fa-file-pdf text-3xl mb-2"></i>
                        <p>Carregue um ou mais PDFs para ver o preview da renomeação</p>
                        <p class="text-sm mt-2">✨ Suporte para múltiplos arquivos simultaneamente</p>
                    </div>
                `;
            }
            if (filesInfo) {
                filesInfo.classList.add('hidden');
            }
            this.currentFiles = [];
            return;
        }

        // Store all PDF files
        this.currentFiles = files;
        console.log(`📂 ${files.length} arquivo(s) PDF carregado(s) para renomeação`);

        // Update files info display
        if (filesInfo && filesList) {
            filesInfo.classList.remove('hidden');

            let html = '';
            files.forEach((file, index) => {
                const fileSize = this.formatFileSize(file.size);
                html += `
                    <div class="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                        <div class="flex items-center">
                            <i class="fas fa-file-pdf text-red-500 text-xl mr-3"></i>
                            <div>
                                <h5 class="font-medium text-gray-800">${file.name}</h5>
                                <p class="text-sm text-gray-600">${fileSize} • Analisando...</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                Arquivo ${index + 1}
                            </span>
                        </div>
                    </div>
                `;
            });
            filesList.innerHTML = html;
        }

        // Update preview
        if (preview) {
            preview.innerHTML = `
                <div class="text-center text-blue-600">
                    <i class="fas fa-files text-3xl mb-2"></i>
                    <p class="font-medium">${files.length} arquivo(s) PDF carregado(s)</p>
                    <p class="text-sm text-gray-500 mt-1">
                        Clique em "Analisar Arquivos" para ver os dados que serão extraídos de todos os arquivos
                    </p>
                    <div class="mt-3 text-sm text-blue-600">
                        <i class="fas fa-info-circle mr-1"></i>
                        Cada página será renomeada automaticamente com base nos dados extraídos
                    </div>
                </div>
            `;
        }
    }

    async analyzeAllFiles() {
        if (!this.currentFiles || this.currentFiles.length === 0) {
            UI.showToast('Nenhum arquivo selecionado', 'error');
            return;
        }

        try {
            const totalFiles = this.currentFiles.length;
            console.log(`🔍 Iniciando análise de ${totalFiles} arquivo(s)`);

            UI.showProgress('Analisando arquivos...', 0);
            this.extractedData = [];

            const layout = document.getElementById('rename-layout')?.value || 'itau';
            let totalPagesProcessed = 0;
            let totalPagesCount = 0;

            // First pass: count total pages
            for (const file of this.currentFiles) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                    totalPagesCount += pdf.numPages;
                } catch (error) {
                    console.error(`❌ Erro ao contar páginas do arquivo ${file.name}:`, error);
                }
            }

            console.log(`📊 Total de páginas para processar: ${totalPagesCount}`);

            // Second pass: process all files
            for (let fileIndex = 0; fileIndex < this.currentFiles.length; fileIndex++) {
                const file = this.currentFiles[fileIndex];

                try {
                    console.log(`📄 Processando arquivo ${fileIndex + 1}/${totalFiles}: ${file.name}`);

                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

                    console.log(`📄 PDF "${file.name}" carregado com ${pdf.numPages} páginas`);

                    // Update files list with page count
                    this.updateFilePageCount(fileIndex, pdf.numPages);

                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        totalPagesProcessed++;
                        const progressPercent = (totalPagesProcessed / totalPagesCount) * 100;

                        // Enhanced progress with file and page info
                        UI.updateProgress(
                            `Analisando ${file.name} - página ${pageNum}/${pdf.numPages} (Total: ${totalPagesProcessed}/${totalPagesCount})`,
                            progressPercent
                        );

                        // Update detailed progress info
                        this.updateDetailedProgress(fileIndex + 1, totalFiles, pageNum, pdf.numPages, totalPagesProcessed, totalPagesCount);

                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');

                        console.log(`📝 Processando página ${pageNum} do arquivo "${file.name}"`);

                        let extractedInfo;
                        if (layout === 'itau') {
                            extractedInfo = await this.templateManager.extractData('itau', pageText, pageNum);
                        } else if (layout === 'bradesco') {
                            extractedInfo = await this.templateManager.extractData('bradesco', pageText, pageNum);
                        } else {
                            extractedInfo = this.extractCustomData(pageText, pageNum);
                        }

                        // Add file information to extracted data
                        extractedInfo.fileName = file.name;
                        extractedInfo.fileIndex = fileIndex;
                        extractedInfo.file = file;

                        this.extractedData.push(extractedInfo);
                    }

                    console.log(`✅ Arquivo "${file.name}" processado com sucesso`);

                } catch (error) {
                    console.error(`❌ Erro ao processar arquivo "${file.name}":`, error);
                    UI.showToast(`Erro ao processar ${file.name}: ${error.message}`, 'warning');
                }
            }

            console.log(`✅ Análise completa: ${this.extractedData.length} páginas processadas de ${totalFiles} arquivo(s)`);

            this.updatePreviewWithMultipleFilesData();
            UI.hideProgress();

            const successCount = this.extractedData.filter(data => data.success).length;
            UI.showToast(`Análise completa: ${successCount}/${this.extractedData.length} páginas processadas com sucesso!`, 'success');

        } catch (error) {
            console.error('❌ Erro ao analisar arquivos:', error);
            UI.hideProgress();
            UI.showToast('Erro ao analisar arquivos: ' + error.message, 'error');
        }
    } extractCustomData(text, pageNum) {
        // Placeholder for custom extraction logic
        return {
            pageNumber: pageNum,
            recipient: 'Custom extraction not implemented',
            value: '0,00',
            type: 'Personalizado',
            rawText: text.substring(0, 200) + '...',
            success: false
        };
    }

    async updatePreviewWithMultipleFilesData() {
        const preview = document.getElementById('rename-preview');
        if (!preview || this.extractedData.length === 0) return;

        const successCount = this.extractedData.filter(data => data.success).length;
        const totalPages = this.extractedData.length;
        const totalFiles = this.currentFiles.length;
        const layout = document.getElementById('rename-layout')?.value || 'itau';

        // Group data by file for better organization
        const dataByFile = {};
        this.extractedData.forEach(data => {
            if (!dataByFile[data.fileName]) {
                dataByFile[data.fileName] = [];
            }
            dataByFile[data.fileName].push(data);
        });

        let html = `
            <div class="space-y-4">
                <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-chart-pie text-blue-600 mr-2"></i>
                        <span class="font-medium text-blue-800">Análise Múltiplos Arquivos</span>
                    </div>
                    <div class="text-right">
                        <div class="text-blue-600 font-bold">${successCount}/${totalPages} páginas processadas</div>
                        <div class="text-blue-500 text-sm">${totalFiles} arquivo(s)</div>
                    </div>
                </div>
        `;

        // Display results by file
        for (const [fileName, fileData] of Object.entries(dataByFile)) {
            const fileSuccessCount = fileData.filter(data => data.success).length;
            const filePages = fileData.length;

            html += `
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <div class="bg-gray-50 px-4 py-2 border-b">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fas fa-file-pdf text-red-500 mr-2"></i>
                                <span class="font-medium text-gray-800">${fileName}</span>
                            </div>
                            <span class="text-sm text-gray-600">${fileSuccessCount}/${filePages} páginas processadas</span>
                        </div>
                    </div>
                    <div class="p-3 space-y-2 max-h-60 overflow-y-auto">
            `;

            for (const data of fileData) {
                const fileName = `${data.recipient} valor R$ ${data.value}.pdf`;
                const statusClass = data.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
                const statusIcon = data.success ? 'fas fa-check-circle text-green-600' : 'fas fa-exclamation-triangle text-red-600';

                // Get type icon and color from template manager
                const typeIcon = await this.templateManager.getTypeIcon(layout, data.type);
                const typeColor = await this.templateManager.getTypeColor(layout, data.type);

                html += `
                    <div class="p-2 border rounded ${statusClass}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="${statusIcon} mr-2 text-sm"></i>
                                <span class="text-sm font-medium">Página ${data.pageNumber}</span>
                                <span class="ml-2 px-2 py-1 text-xs rounded-full ${typeColor}">
                                    <i class="${typeIcon} mr-1"></i>${data.type}
                                </span>
                            </div>
                            <span class="text-xs text-gray-500">
                                ${data.success ? 'OK' : 'Falha'}
                            </span>
                        </div>
                        <div class="mt-1">
                            <div class="text-xs font-mono bg-white p-1 rounded border text-gray-700">
                                ${fileName}
                            </div>
                            <div class="text-xs text-gray-600 mt-1">
                                ${data.recipient} | R$ ${data.value}
                            </div>
                        </div>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        html += '</div>';
        preview.innerHTML = html;
    }

    getTypeIcon(type) {
        const icons = {
            'PIX': 'fas fa-mobile-alt',
            'Boleto': 'fas fa-barcode',
            'TED': 'fas fa-university',
            'Desconhecido': 'fas fa-question-circle'
        };
        return icons[type] || icons['Desconhecido'];
    }

    getTypeColor(type) {
        const colors = {
            'PIX': 'bg-blue-100 text-blue-800',
            'Boleto': 'bg-orange-100 text-orange-800',
            'TED': 'bg-purple-100 text-purple-800',
            'Desconhecido': 'bg-gray-100 text-gray-800'
        };
        return colors[type] || colors['Desconhecido'];
    }

    async processAndRenameAllFiles() {
        if (!this.currentFiles || this.currentFiles.length === 0 || this.extractedData.length === 0) {
            UI.showToast('Analise os arquivos primeiro', 'warning');
            return;
        }

        try {
            console.log(`🔄 Iniciando processamento de ${this.currentFiles.length} arquivo(s)`);
            UI.showProgress('Processando e dividindo PDFs...', 0);

            this.processedPages = [];
            let totalProcessed = 0;
            const totalPages = this.extractedData.length;

            // Group extracted data by file for processing
            const dataByFile = {};
            this.extractedData.forEach(data => {
                if (!dataByFile[data.fileName]) {
                    dataByFile[data.fileName] = [];
                }
                dataByFile[data.fileName].push(data);
            });

            console.log(`📊 Processando ${totalPages} páginas de ${Object.keys(dataByFile).length} arquivo(s)`);

            // Process each file
            for (const [fileName, fileData] of Object.entries(dataByFile)) {
                console.log(`📄 Processando arquivo: ${fileName} (${fileData.length} páginas)`);

                // Find the original file
                const originalFile = this.currentFiles.find(f => f.name === fileName);
                if (!originalFile) {
                    console.error(`❌ Arquivo original não encontrado: ${fileName}`);
                    continue;
                }

                try {
                    const arrayBuffer = await originalFile.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

                    // Process each page of this file
                    for (const data of fileData) {
                        totalProcessed++;
                        const progressPercent = (totalProcessed / totalPages) * 100;

                        UI.updateProgress(
                            `Processando ${fileName} - página ${data.pageNumber} (Total: ${totalProcessed}/${totalPages})`,
                            progressPercent
                        );

                        // Update detailed progress for processing
                        this.updateDetailedProgress(
                            Object.keys(dataByFile).indexOf(fileName) + 1,
                            Object.keys(dataByFile).length,
                            fileData.indexOf(data) + 1,
                            fileData.length,
                            totalProcessed,
                            totalPages
                        );

                        // Create new PDF for this page
                        const newPdf = await PDFLib.PDFDocument.create();
                        const [copiedPage] = await newPdf.copyPages(pdfDoc, [data.pageNumber - 1]);
                        newPdf.addPage(copiedPage);

                        // Generate filename based on extracted data
                        const generatedFileName = data.success
                            ? `${data.recipient} valor R$ ${data.value}.pdf`
                            : `${fileName} - Página ${data.pageNumber} - Não processado.pdf`;

                        // Convert to blob
                        const pdfBytes = await newPdf.save();
                        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

                        this.processedPages.push({
                            fileName: generatedFileName,
                            originalFileName: fileName,
                            blob,
                            data,
                            url: URL.createObjectURL(blob)
                        });

                        console.log(`✅ Página ${data.pageNumber} de "${fileName}" processada: ${generatedFileName}`);
                    }

                    console.log(`✅ Arquivo "${fileName}" processado completamente`);

                } catch (error) {
                    console.error(`❌ Erro ao processar arquivo "${fileName}":`, error);
                    UI.showToast(`Erro ao processar ${fileName}: ${error.message}`, 'warning');
                }
            }

            console.log(`✅ Processamento completo: ${this.processedPages.length} páginas processadas`);

            this.showMultipleFilesResults();
            UI.hideProgress();

            const successCount = this.processedPages.filter(p => p.data.success).length;
            UI.showToast(`${successCount}/${this.processedPages.length} páginas processadas com sucesso!`, 'success');

        } catch (error) {
            console.error('❌ Erro ao processar arquivos:', error);
            UI.hideProgress();
            UI.showToast('Erro ao processar arquivos: ' + error.message, 'error');
        }
    }

    showMultipleFilesResults() {
        const resultsDiv = document.getElementById('rename-results');
        const resultsList = document.getElementById('rename-results-list');
        const downloadAllBtn = document.getElementById('rename-download-all');

        if (!resultsDiv || !resultsList) return;

        resultsDiv.classList.remove('hidden');
        const downloadOptions = document.getElementById('download-options');
        if (downloadOptions) {
            downloadOptions.classList.remove('hidden');
        }

        // Group results by original file for better organization
        const resultsByFile = {};
        this.processedPages.forEach((page, index) => {
            if (!resultsByFile[page.originalFileName]) {
                resultsByFile[page.originalFileName] = [];
            }
            resultsByFile[page.originalFileName].push({ ...page, index });
        });

        let html = '';

        // Summary header
        const totalFiles = Object.keys(resultsByFile).length;
        const totalPages = this.processedPages.length;
        const successPages = this.processedPages.filter(p => p.data.success).length;

        html += `
            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
                        <span class="font-medium text-blue-800">Resultado do Processamento</span>
                    </div>
                    <div class="text-right text-blue-700">
                        <div class="font-bold">${successPages}/${totalPages} páginas renomeadas</div>
                        <div class="text-sm">${totalFiles} arquivo(s) processado(s)</div>
                    </div>
                </div>
            </div>
        `;

        // Results by file
        for (const [originalFileName, pages] of Object.entries(resultsByFile)) {
            const fileSuccessCount = pages.filter(p => p.data.success).length;

            html += `
                <div class="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div class="bg-gray-50 px-4 py-2 border-b">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fas fa-file-pdf text-red-500 mr-2"></i>
                                <span class="font-medium text-gray-800">${originalFileName}</span>
                            </div>
                            <div class="text-sm text-gray-600">
                                ${fileSuccessCount}/${pages.length} páginas processadas
                            </div>
                        </div>
                    </div>
                    <div class="p-2 space-y-2 max-h-60 overflow-y-auto">
            `;

            for (const page of pages) {
                const statusClass = page.data.success
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50';
                const statusIcon = page.data.success
                    ? 'fas fa-check-circle text-green-600'
                    : 'fas fa-exclamation-triangle text-red-600';

                html += `
                    <div class="flex items-center justify-between p-2 border rounded ${statusClass}">
                        <div class="flex items-center flex-1">
                            <i class="${statusIcon} mr-2"></i>
                            <span class="file-number text-sm font-medium mr-2">P${page.data.pageNumber}</span>
                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-gray-800 text-sm truncate" title="${page.fileName}">
                                    ${page.fileName}
                                </p>
                                <p class="text-xs text-gray-600">
                                    ${page.data.success ? 'Processado com sucesso' : 'Dados não extraídos'}
                                </p>
                            </div>
                        </div>
                        <button onclick="window.pdfRenamer.downloadSingle(${page.index})" 
                                class="btn-base btn-primary btn-sm ml-2">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        resultsList.innerHTML = html;
    }

    downloadSingle(index) {
        if (index >= 0 && index < this.processedPages.length) {
            const page = this.processedPages[index];
            const link = document.createElement('a');
            link.href = page.url;
            link.download = page.fileName;
            link.click();

            UI.addLog(`📥 Download iniciado: ${page.fileName}`);
        }
    }

    async downloadOrganizedZip() {
        if (this.processedPages.length === 0) {
            UI.showToast('Nenhum arquivo para download', 'warning');
            return;
        }

        try {
            console.log(`📦 Criando ZIP organizado com ${this.processedPages.length} arquivo(s)`);
            UI.showProgress('Criando arquivo ZIP organizado...', 0);

            const zip = new JSZip();

            // Group files by original file for organized folder structure
            const filesByOriginal = {};
            this.processedPages.forEach(page => {
                if (!filesByOriginal[page.originalFileName]) {
                    filesByOriginal[page.originalFileName] = [];
                }
                filesByOriginal[page.originalFileName].push(page);
            });

            // Create folder structure based on original files
            let processedCount = 0;
            const totalFiles = this.processedPages.length;

            for (const [originalFileName, pages] of Object.entries(filesByOriginal)) {
                // Clean original filename for folder name
                const cleanFolderName = this.cleanFileNameForFolder(originalFileName);
                const folderName = `${cleanFolderName}_Páginas_Processadas`;

                console.log(`📂 Criando pasta: ${folderName}`);

                // Add files to the folder
                for (const page of pages) {
                    processedCount++;
                    const progress = (processedCount / totalFiles) * 90; // Reserve 10% for final ZIP creation

                    UI.updateProgress(
                        `Adicionando ao ZIP: ${page.fileName} (${processedCount}/${totalFiles})`,
                        progress
                    );

                    // Convert blob to array buffer for JSZip
                    const arrayBuffer = await page.blob.arrayBuffer();

                    // Add file to specific folder in ZIP
                    zip.folder(folderName).file(page.fileName, arrayBuffer);
                }

                // Store original file info in a text file within the folder
                const infoText = this.generateFolderInfo(originalFileName, pages);
                zip.folder(folderName).file('_INFO.txt', infoText);
            }

            UI.updateProgress('Finalizando arquivo ZIP...', 95);

            // Generate ZIP file
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            // Create download link
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
            const zipFileName = `PDFs_Renomeados_${timestamp}.zip`;

            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(zipBlob);
            downloadLink.download = zipFileName;
            downloadLink.click();

            // Cleanup
            URL.revokeObjectURL(downloadLink.href);

            UI.hideProgress();
            UI.showToast(
                `✅ ZIP criado com sucesso! ${Object.keys(filesByOriginal).length} pasta(s) organizadas`,
                'success'
            );

            console.log(`📦 ZIP criado: ${zipFileName}`);
            console.log(`📊 Estrutura: ${Object.keys(filesByOriginal).length} pasta(s), ${totalFiles} arquivo(s)`);

        } catch (error) {
            console.error('❌ Erro ao criar ZIP organizado:', error);
            UI.hideProgress();
            UI.showToast('Erro ao criar ZIP: ' + error.message, 'error');
        }
    }

    generateFolderInfo(originalFileName, pages) {
        const timestamp = new Date().toLocaleString('pt-BR');
        const successCount = pages.filter(p => p.data.success).length;

        let info = `═══════════════════════════════════════════════════════════════════
📁 INFORMAÇÕES DA PASTA - PDF RENOMEADO
═══════════════════════════════════════════════════════════════════

📅 Data de Processamento: ${timestamp}
📄 Arquivo Original: ${originalFileName}
📊 Total de Páginas: ${pages.length}
✅ Páginas Processadas com Sucesso: ${successCount}
❌ Páginas com Falha: ${pages.length - successCount}

═══════════════════════════════════════════════════════════════════
📋 LISTA DE ARQUIVOS GERADOS:
═══════════════════════════════════════════════════════════════════

`;

        pages.forEach((page, index) => {
            const status = page.data.success ? '✅' : '❌';
            const recipient = page.data.recipient || 'Nome não extraído';
            const value = page.data.value || '0,00';

            info += `${index + 1}. ${status} ${page.fileName}\n`;
            info += `   └─ Página Original: ${page.data.pageNumber}\n`;
            info += `   └─ Destinatário: ${recipient}\n`;
            info += `   └─ Valor: R$ ${value}\n`;
            info += `   └─ Tipo: ${page.data.type}\n\n`;
        });

        info += `═══════════════════════════════════════════════════════════════════
📝 OBSERVAÇÕES:
═══════════════════════════════════════════════════════════════════

• Cada arquivo PDF corresponde a uma página do arquivo original
• Os nomes foram gerados automaticamente baseados nos dados extraídos
• Arquivos com ❌ indicam que não foi possível extrair dados válidos
• O sistema preservou a numeração original das páginas

Sistema PDF Processor - Renomeação Automática
═══════════════════════════════════════════════════════════════════`;

        return info;
    }

    cleanFileNameForFolder(filename) {
        // Remove extension and clean special characters for folder name
        return filename
            .replace(/\.pdf$/i, '')
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50); // Limit length
    }



    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateFilePageCount(fileIndex, pageCount) {
        const filesList = document.getElementById('rename-files-list');
        if (!filesList) return;

        const fileElements = filesList.children;
        if (fileIndex < fileElements.length) {
            const fileElement = fileElements[fileIndex];
            const sizeText = fileElement.querySelector('.text-sm.text-gray-600');
            if (sizeText) {
                const currentText = sizeText.textContent;
                sizeText.textContent = currentText.replace('Analisando...', `${pageCount} páginas`);
            }
        }
    }

    updateDetailedProgress(currentFile, totalFiles, currentPage, totalPagesInFile, overallProgress, totalPages) {
        const detailedProgress = document.getElementById('rename-detailed-progress');
        const filesStatus = document.getElementById('rename-files-status');

        if (filesStatus) {
            filesStatus.textContent = `Processando arquivo ${currentFile}/${totalFiles}`;
        }

        if (detailedProgress) {
            detailedProgress.innerHTML = `
                <div class="flex justify-between items-center">
                    <span>📂 Arquivo: ${currentFile}/${totalFiles}</span>
                    <span>📄 Página: ${currentPage}/${totalPagesInFile}</span>
                    <span>📊 Total: ${overallProgress}/${totalPages}</span>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pdfRenamer = new PDFRenamer();
});
