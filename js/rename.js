// PDF Rename and Split Module
class PDFRenamer {
    constructor() {
        console.log('🔧 Inicializando PDFRenamer...');
        this.currentFile = null;
        this.extractedData = [];
        this.processedPages = [];
        this.initializeRenameFeatures();
        console.log('✅ PDFRenamer inicializado com sucesso!');
    }

    initializeRenameFeatures() {
        this.setupEventListeners();
        this.setupLayoutSelector();
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
        const customOptions = document.getElementById('custom-options');

        if (itauOptions && customOptions) {
            if (layout === 'itau') {
                itauOptions.style.display = 'block';
                customOptions.style.display = 'none';
            } else if (layout === 'custom') {
                itauOptions.style.display = 'none';
                customOptions.style.display = 'block';
            }
        }
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
                    extractedInfo = this.extractItauData(pageText, pageNum);
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
    }

    extractItauData(text, pageNum) {
        console.log('🏦 Extraindo dados do Itaú da página', pageNum);

        // Patterns for Itaú PIX receipts
        const patterns = {
            // Busca por padrões de valor em Real
            value: /R\$\s*([\d.,]+)/g,
            // Busca por nomes (após "Para:" ou "Recebedor:" ou padrões similares)
            recipient: /(?:Para:|Recebedor:|Favorecido:)\s*([A-ZÁÊÇÕÜÚ][a-záêçõüú\s]+(?:[A-ZÁÊÇÕÜÚ][a-záêçõüú\s]*)*)/i,
            // Busca alternativa por nomes em maiúsculo
            recipientAlt: /\b([A-ZÁÊÇÕÜÚ]{2,}(?:\s+[A-ZÁÊÇÕÜÚ]{2,})*)\b/g,
            // Busca por CPF/CNPJ para validar contexto
            document: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g
        };

        const result = {
            pageNumber: pageNum,
            recipient: 'Destinatário não encontrado',
            value: '0,00',
            rawText: text.substring(0, 200) + '...',
            success: false
        };

        try {
            // Extract value
            const valueMatches = [...text.matchAll(patterns.value)];
            if (valueMatches.length > 0) {
                // Get the largest value found (usually the transfer amount)
                const values = valueMatches.map(match => {
                    const cleanValue = match[1].replace(/\./g, '').replace(',', '.');
                    return parseFloat(cleanValue);
                }).filter(v => !isNaN(v));

                if (values.length > 0) {
                    const maxValue = Math.max(...values);
                    result.value = maxValue.toFixed(2).replace('.', ',');
                }
            }

            // Extract recipient name
            let recipientMatch = text.match(patterns.recipient);
            if (recipientMatch) {
                result.recipient = recipientMatch[1].trim();
                result.success = true;
            } else {
                // Try alternative pattern - look for names in caps
                const altMatches = [...text.matchAll(patterns.recipientAlt)];
                if (altMatches.length > 0) {
                    // Filter out common bank terms
                    const bankTerms = ['PIX', 'BANCO', 'ITAU', 'TRANSFERENCIA', 'COMPROVANTE', 'AGENCIA', 'CONTA'];
                    const candidates = altMatches
                        .map(match => match[1].trim())
                        .filter(name => name.length >= 4 && !bankTerms.some(term => name.includes(term)));

                    if (candidates.length > 0) {
                        result.recipient = this.formatName(candidates[0]);
                        result.success = true;
                    }
                }
            }

            console.log(`📊 Dados extraídos da página ${pageNum}:`, result);

        } catch (error) {
            console.error(`❌ Erro ao extrair dados da página ${pageNum}:`, error);
        }

        return result;
    }

    extractCustomData(text, pageNum) {
        // Placeholder for custom extraction logic
        return {
            pageNumber: pageNum,
            recipient: 'Custom extraction not implemented',
            value: '0,00',
            rawText: text.substring(0, 200) + '...',
            success: false
        };
    }

    formatName(name) {
        // Convert to title case
        return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    updatePreviewWithData() {
        const preview = document.getElementById('rename-preview');
        if (!preview || this.extractedData.length === 0) return;

        const successCount = this.extractedData.filter(data => data.success).length;
        const totalPages = this.extractedData.length;

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

        this.extractedData.forEach((data, index) => {
            const fileName = `${data.recipient} valor R$ ${data.value}.pdf`;
            const statusClass = data.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
            const statusIcon = data.success ? 'fas fa-check-circle text-green-600' : 'fas fa-exclamation-triangle text-red-600';

            html += `
                <div class="p-3 border rounded-lg ${statusClass}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="${statusIcon} mr-2"></i>
                            <span class="font-medium">Página ${data.pageNumber}</span>
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
        });

        html += '</div>';
        preview.innerHTML = html;
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
