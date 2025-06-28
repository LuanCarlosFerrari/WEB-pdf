// PDF Rename and Split Module
class PDFRenamer {
    constructor() {
        console.log('🔧 Inicializando PDFRenamer...');
        this.currentFile = null;
        this.extractedData = [];
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
                console.log('🔄 Botão de processamento clicado');
                this.processAndRename();
            });
        }

        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                console.log('👁️ Botão de preview clicado');
                this.analyzeFile();
            });
        }

        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => {
                console.log('⬇️ Botão de download clicado');
                this.downloadAllFiles();
            });
        }

        if (layoutSelect) {
            layoutSelect.addEventListener('change', () => {
                this.updateLayoutOptions();
            });
        }

        // Atualizar preview quando arquivos forem carregados
        document.addEventListener('filesUploaded', () => {
            console.log('📁 Arquivos carregados - atualizando preview de renomeação');
            this.updateRenamePreview();
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

    updateRenamePreview() {
        const files = CORE.getUploadedFiles().filter(file => file.type === 'application/pdf');
        const preview = document.getElementById('rename-preview');
        const fileInfo = document.getElementById('rename-file-info');

        if (files.length === 0) {
            if (preview) {
                preview.innerHTML = `
                    <div class="text-center text-gray-500">
                        <i class="fas fa-file-pdf text-3xl mb-2"></i>
                        <p>Carregue um PDF para ver o preview da renomeação</p>
                    </div>
                `;
            }
            if (fileInfo) {
                fileInfo.classList.add('hidden');
            }
            return;
        }

        const file = files[0]; // Use only the first file for rename
        this.currentFile = file;

        // Update file info
        if (fileInfo) {
            fileInfo.classList.remove('hidden');
            const fileName = document.getElementById('rename-file-name');
            const fileSize = document.getElementById('rename-file-size');
            const filePages = document.getElementById('rename-file-pages');

            if (fileName) fileName.textContent = file.name;
            if (fileSize) fileSize.textContent = this.formatFileSize(file.size);
            if (filePages) filePages.textContent = 'Analisando...';
        }

        // Update preview
        if (preview) {
            preview.innerHTML = `
                <div class="text-center text-blue-600">
                    <i class="fas fa-file-pdf text-3xl mb-2"></i>
                    <p class="font-medium">${file.name}</p>
                    <p class="text-sm text-gray-500">Clique em "Analisar Arquivo" para ver os dados que serão extraídos</p>
                </div>
            `;
        }
    }

    async analyzeFile() {
        if (!this.currentFile) {
            UI.showToast('Nenhum arquivo selecionado', 'error');
            return;
        }

        try {
            UI.showProgress('Analisando arquivo...', 0);

            const arrayBuffer = await this.currentFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

            console.log(`📄 PDF carregado com ${pdf.numPages} páginas`);

            // Update pages count
            const filePages = document.getElementById('rename-file-pages');
            if (filePages) {
                filePages.textContent = `${pdf.numPages} páginas`;
            }

            this.extractedData = [];
            const layout = document.getElementById('rename-layout')?.value || 'itau';

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                UI.updateProgress(`Analisando página ${pageNum}/${pdf.numPages}...`, (pageNum / pdf.numPages) * 100);

                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');

                console.log(`📝 Texto da página ${pageNum}:`, pageText.substring(0, 100) + '...');

                let extractedInfo;
                if (layout === 'itau') {
                    // Usar o template modular do Itaú
                    extractedInfo = await this.templateManager.extractData('itau', pageText, pageNum);
                } else if (layout === 'bradesco') {
                    // Usar o template modular do Bradesco
                    extractedInfo = await this.templateManager.extractData('bradesco', pageText, pageNum);
                } else {
                    extractedInfo = this.extractCustomData(pageText, pageNum);
                }

                this.extractedData.push(extractedInfo);
            }

            this.updatePreviewWithData();
            UI.hideProgress();

        } catch (error) {
            console.error('❌ Erro ao analisar arquivo:', error);
            UI.hideProgress();
            UI.showToast('Erro ao analisar arquivo: ' + error.message, 'error');
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

    async updatePreviewWithData() {
        const preview = document.getElementById('rename-preview');
        if (!preview || this.extractedData.length === 0) return;

        const successCount = this.extractedData.filter(data => data.success).length;
        const totalPages = this.extractedData.length;
        const layout = document.getElementById('rename-layout')?.value || 'itau';

        let html = `
            <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-chart-pie text-blue-600 mr-2"></i>
                        <span class="font-medium text-blue-800">Análise Completa</span>
                    </div>
                    <span class="text-blue-600 font-bold">${successCount}/${totalPages} páginas processadas</span>
                </div>
        `;

        for (const [index, data] of this.extractedData.entries()) {
            const fileName = `${data.recipient} valor R$ ${data.value}.pdf`;
            const statusClass = data.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
            const statusIcon = data.success ? 'fas fa-check-circle text-green-600' : 'fas fa-exclamation-triangle text-red-600';

            // Ícone baseado no tipo de documento usando o template manager
            const typeIcon = await this.templateManager.getTypeIcon(layout, data.type);
            const typeColor = await this.templateManager.getTypeColor(layout, data.type);

            html += `
                <div class="p-3 border rounded-lg ${statusClass}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="${statusIcon} mr-2"></i>
                            <span class="font-medium">Página ${data.pageNumber}</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full ${typeColor}">
                                <i class="${typeIcon} mr-1"></i>${data.type}
                            </span>
                        </div>
                        <span class="text-xs text-gray-500">
                            ${data.success ? 'Dados extraídos' : 'Falha na extração'}
                        </span>
                    </div>
                    <div class="mt-2">
                        <div class="text-sm font-mono bg-white p-2 rounded border">
                            ${fileName}
                        </div>
                        <div class="text-xs text-gray-600 mt-1">
                            Destinatário: ${data.recipient} | Valor: R$ ${data.value}
                        </div>
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

    async processAndRename() {
        if (!this.currentFile || this.extractedData.length === 0) {
            UI.showToast('Analise o arquivo primeiro', 'warning');
            return;
        }

        try {
            UI.showProgress('Processando e dividindo PDF...', 0);

            const arrayBuffer = await this.currentFile.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            this.processedPages = [];

            for (let i = 0; i < this.extractedData.length; i++) {
                const data = this.extractedData[i];
                UI.updateProgress(
                    `Processando página ${data.pageNumber}/${this.extractedData.length}...`,
                    ((i + 1) / this.extractedData.length) * 100
                );

                // Create new PDF for this page
                const newPdf = await PDFLib.PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [data.pageNumber - 1]);
                newPdf.addPage(copiedPage);

                // Generate filename
                const fileName = data.success
                    ? `${data.recipient} valor R$ ${data.value}.pdf`
                    : `Página ${data.pageNumber} - Não processado.pdf`;

                // Convert to blob
                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });

                this.processedPages.push({
                    fileName,
                    blob,
                    data,
                    url: URL.createObjectURL(blob)
                });
            }

            this.showResults();
            UI.hideProgress();
            UI.showToast(`${this.processedPages.length} páginas processadas com sucesso!`, 'success');

        } catch (error) {
            console.error('❌ Erro ao processar e renomear:', error);
            UI.hideProgress();
            UI.showToast('Erro ao processar: ' + error.message, 'error');
        }
    }

    showResults() {
        const resultsDiv = document.getElementById('rename-results');
        const resultsList = document.getElementById('rename-results-list');
        const downloadAllBtn = document.getElementById('rename-download-all');

        if (!resultsDiv || !resultsList) return;

        resultsDiv.classList.remove('hidden');
        if (downloadAllBtn) {
            downloadAllBtn.classList.remove('hidden');
        }

        let html = '';
        this.processedPages.forEach((page, index) => {
            const statusClass = page.data.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50';

            html += `
                <div class="flex items-center justify-between p-3 border rounded-lg ${statusClass}">
                    <div class="flex items-center flex-1">
                        <span class="file-number">${index + 1}</span>
                        <div class="ml-3 flex-1">
                            <p class="font-medium text-gray-800">${page.fileName}</p>
                            <p class="text-sm text-gray-600">
                                Página ${page.data.pageNumber} | ${page.data.success ? 'Processado' : 'Dados não extraídos'}
                            </p>
                        </div>
                    </div>
                    <button onclick="window.pdfRenamer.downloadSingle(${index})" 
                            class="btn-base btn-primary btn-sm">
                        <i class="fas fa-download mr-1"></i>
                        Baixar
                    </button>
                </div>
            `;
        });

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

    async downloadAllFiles() {
        if (this.processedPages.length === 0) {
            UI.showToast('Nenhum arquivo para download', 'warning');
            return;
        }

        try {
            // For now, download files one by one
            // In the future, could create a ZIP file
            this.processedPages.forEach((page, index) => {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = page.url;
                    link.download = page.fileName;
                    link.click();
                }, index * 500); // Stagger downloads
            });

            UI.showToast(`Download de ${this.processedPages.length} arquivos iniciado`, 'success');
            UI.addLog(`📥 Download múltiplo iniciado - ${this.processedPages.length} arquivos`);

        } catch (error) {
            console.error('❌ Erro no download múltiplo:', error);
            UI.showToast('Erro no download: ' + error.message, 'error');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pdfRenamer = new PDFRenamer();
});
