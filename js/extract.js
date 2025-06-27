// PDF Page Extraction Module
class PDFExtractor {
    constructor() {
        this.initializeExtractFeatures();
    }

    initializeExtractFeatures() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const extractBtn = document.getElementById('extract-pages');
        const modeRadios = document.querySelectorAll('input[name="extract-mode"]');

        if (extractBtn) {
            extractBtn.addEventListener('click', () => {
                console.log('🔄 Botão de extração clicado');
                this.extractPages();
            });
            console.log('✅ Event listener adicionado ao botão extract-pages');
        } else {
            console.error('❌ Botão extract-pages não encontrado');
        }

        modeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateExtractOptions());
        });

        this.updateExtractOptions();

        // Atualizar preview quando arquivos forem carregados
        document.addEventListener('filesUploaded', () => {
            console.log('📁 Arquivos carregados - atualizando preview de extração');
            this.updateExtractPreview();
        });
    }

    updateExtractOptions() {
        const extractMode = document.querySelector('input[name="extract-mode"]:checked')?.value;
        const customOptions = document.getElementById('custom-extract-options');

        if (customOptions) {
            customOptions.style.display = extractMode === 'custom' ? 'block' : 'none';
        }
    }

    updateExtractPreview() {
        const files = CORE.getUploadedFiles().filter(file => file.type === 'application/pdf');
        const previewContainer = document.getElementById('extract-preview');

        if (!previewContainer) return;

        if (files.length === 0) {
            previewContainer.innerHTML = '<p class="no-files">Nenhum PDF carregado para extração</p>';
            return;
        }

        previewContainer.innerHTML = `
            <h4>Arquivos para extração (${files.length} arquivo${files.length !== 1 ? 's' : ''}):</h4>
            <div class="extract-file-list">
                ${files.map((file, index) => `
                    <div class="extract-file-item" data-index="${index}">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                        <span class="file-status">Analisando...</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Analisar arquivos de forma assíncrona
        this.analyzeFilesForExtraction(files);
    }

    async analyzeFilesForExtraction(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const pageCount = pdf.getPageCount();

                const fileItem = document.querySelector(`[data-index="${i}"] .file-status`);
                if (fileItem) {
                    fileItem.textContent = `${pageCount} páginas`;
                    fileItem.style.color = '#28a745';
                }
            } catch (error) {
                const fileItem = document.querySelector(`[data-index="${i}"] .file-status`);
                if (fileItem) {
                    fileItem.textContent = 'Erro ao analisar';
                    fileItem.style.color = '#dc3545';
                }
            }
        }
    }

    async extractPages() {
        const files = CORE.getUploadedFiles().filter(file => file.type === 'application/pdf');

        if (files.length === 0) {
            UI.showToast('Nenhum arquivo PDF carregado', 'warning');
            return;
        }

        const extractMode = document.querySelector('input[name="extract-mode"]:checked')?.value || 'first';

        UI.showProgress(0, 'Iniciando extração de páginas...');

        try {
            let totalExtracted = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progress = ((i + 1) / files.length) * 100;

                UI.showProgress(progress, `Extraindo de ${file.name}...`);

                const extracted = await this.processSinglePDFExtraction(file, extractMode);
                totalExtracted += extracted;

                UI.addLog(`Páginas extraídas de ${file.name}: ${extracted}`);

                // Pequena pausa para não sobrecarregar
                await this.sleep(200);
            }

            UI.hideProgress();
            UI.showToast(`Extração concluída! ${totalExtracted} página(s) extraída(s) de ${files.length} arquivo(s)`, 'success');

        } catch (error) {
            console.error('Erro na extração de páginas:', error);
            UI.hideProgress();
            UI.showToast('Erro durante a extração de páginas', 'error');
        }
    }

    async processSinglePDFExtraction(file, extractMode) {
        try {
            // Carregar o PDF usando PDF-lib
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            UI.addLog(`PDF carregado: ${file.name} (${totalPages} páginas)`);

            let extractedCount = 0;

            switch (extractMode) {
                case 'first':
                    extractedCount = await this.extractFirstPage(pdfDoc, file.name);
                    break;
                case 'last':
                    extractedCount = await this.extractLastPage(pdfDoc, file.name, totalPages);
                    break;
                case 'odd':
                    extractedCount = await this.extractOddPages(pdfDoc, file.name, totalPages);
                    break;
                case 'even':
                    extractedCount = await this.extractEvenPages(pdfDoc, file.name, totalPages);
                    break;
                case 'custom':
                    extractedCount = await this.extractCustomPages(pdfDoc, file.name, totalPages);
                    break;
                default:
                    extractedCount = await this.extractFirstPage(pdfDoc, file.name);
            }

            return extractedCount;

        } catch (error) {
            console.error(`Erro ao processar ${file.name}:`, error);
            throw error;
        }
    }

    async extractFirstPage(pdfDoc, originalName) {
        if (pdfDoc.getPageCount() === 0) return 0;

        const newPdf = await PDFLib.PDFDocument.create();
        const [firstPage] = await newPdf.copyPages(pdfDoc, [0]);
        newPdf.addPage(firstPage);

        const pdfBytes = await newPdf.save();
        const fileName = `${originalName.replace('.pdf', '')}_primeira_página.pdf`;

        this.downloadPDF(pdfBytes, fileName);
        UI.addLog(`Primeira página extraída: ${fileName}`);

        return 1;
    }

    async extractLastPage(pdfDoc, originalName, totalPages) {
        if (totalPages === 0) return 0;

        const newPdf = await PDFLib.PDFDocument.create();
        const [lastPage] = await newPdf.copyPages(pdfDoc, [totalPages - 1]);
        newPdf.addPage(lastPage);

        const pdfBytes = await newPdf.save();
        const fileName = `${originalName.replace('.pdf', '')}_última_página.pdf`;

        this.downloadPDF(pdfBytes, fileName);
        UI.addLog(`Última página extraída: ${fileName}`);

        return 1;
    }

    async extractOddPages(pdfDoc, originalName, totalPages) {
        const oddPageIndices = [];
        for (let i = 0; i < totalPages; i += 2) {
            oddPageIndices.push(i); // Páginas 1, 3, 5, etc. (índices 0, 2, 4, etc.)
        }

        if (oddPageIndices.length === 0) return 0;

        const newPdf = await PDFLib.PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, oddPageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const fileName = `${originalName.replace('.pdf', '')}_páginas_ímpares.pdf`;

        this.downloadPDF(pdfBytes, fileName);
        UI.addLog(`Páginas ímpares extraídas: ${fileName} (${oddPageIndices.length} páginas)`);

        return oddPageIndices.length;
    }

    async extractEvenPages(pdfDoc, originalName, totalPages) {
        const evenPageIndices = [];
        for (let i = 1; i < totalPages; i += 2) {
            evenPageIndices.push(i); // Páginas 2, 4, 6, etc. (índices 1, 3, 5, etc.)
        }

        if (evenPageIndices.length === 0) return 0;

        const newPdf = await PDFLib.PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, evenPageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const fileName = `${originalName.replace('.pdf', '')}_páginas_pares.pdf`;

        this.downloadPDF(pdfBytes, fileName);
        UI.addLog(`Páginas pares extraídas: ${fileName} (${evenPageIndices.length} páginas)`);

        return evenPageIndices.length;
    }

    async extractCustomPages(pdfDoc, originalName, totalPages) {
        const rangesInput = document.getElementById('extract-ranges')?.value || '';

        if (!rangesInput.trim()) {
            UI.showToast('Por favor, especifique as páginas a serem extraídas', 'warning');
            return 0;
        }

        const baseName = originalName.replace('.pdf', '');
        const ranges = this.parsePageRanges(rangesInput, totalPages);

        if (ranges.length === 0) {
            UI.showToast('Páginas especificadas inválidas', 'error');
            return 0;
        }

        // Coletar todos os índices de páginas únicos
        const allPageIndices = new Set();
        ranges.forEach(range => {
            for (let page = range.start; page <= range.end; page++) {
                allPageIndices.add(page - 1); // Converter para índice baseado em 0
            }
        });

        const pageIndicesArray = Array.from(allPageIndices).sort((a, b) => a - b);

        if (pageIndicesArray.length === 0) return 0;

        const newPdf = await PDFLib.PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndicesArray);
        copiedPages.forEach(page => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const fileName = `${baseName}_páginas_extraídas.pdf`;

        this.downloadPDF(pdfBytes, fileName);
        UI.addLog(`Páginas customizadas extraídas: ${fileName} (${pageIndicesArray.length} páginas)`);

        return pageIndicesArray.length;
    }

    parsePageRanges(rangesInput, totalPages) {
        const ranges = [];
        const parts = rangesInput.split(',');

        for (const part of parts) {
            const trimmed = part.trim();

            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(num => parseInt(num.trim()));

                if (start && end && start <= end && start >= 1 && end <= totalPages) {
                    ranges.push({ start, end });
                }
            } else {
                const page = parseInt(trimmed);
                if (page && page >= 1 && page <= totalPages) {
                    ranges.push({ start: page, end: page });
                }
            }
        }

        return ranges;
    }

    downloadPDF(pdfBytes, fileName) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Método auxiliar para validar páginas customizadas
    validatePageRanges(rangesInput, totalPages) {
        try {
            const ranges = this.parsePageRanges(rangesInput, totalPages);
            return ranges.length > 0;
        } catch (error) {
            return false;
        }
    }

    // Método para obter exemplo de formato de páginas
    getPageRangesExample() {
        return "Exemplos: 1-5, 7, 10-15, 20";
    }

    // Método para contar total de páginas que serão extraídas
    async countPagesToExtract(files, extractMode) {
        let totalPages = 0;

        for (const file of files) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                const pageCount = pdfDoc.getPageCount();

                switch (extractMode) {
                    case 'first':
                    case 'last':
                        totalPages += pageCount > 0 ? 1 : 0;
                        break;
                    case 'odd':
                        totalPages += Math.ceil(pageCount / 2);
                        break;
                    case 'even':
                        totalPages += Math.floor(pageCount / 2);
                        break;
                    case 'custom':
                        const rangesInput = document.getElementById('extract-ranges')?.value || '';
                        const ranges = this.parsePageRanges(rangesInput, pageCount);
                        const uniquePages = new Set();
                        ranges.forEach(range => {
                            for (let page = range.start; page <= range.end; page++) {
                                uniquePages.add(page);
                            }
                        });
                        totalPages += uniquePages.size;
                        break;
                }
            } catch (error) {
                console.error(`Erro ao analisar ${file.name}:`, error);
            }
        }

        return totalPages;
    }
}

// Inicializar quando o DOM estiver pronto
// Validação em tempo real para páginas customizadas
document.addEventListener('DOMContentLoaded', () => {
    const rangesInput = document.getElementById('extract-ranges');
    if (rangesInput) {
        rangesInput.addEventListener('input', (e) => {
            const value = e.target.value;
            // Adicionar feedback visual para formato válido/inválido
            if (value.trim()) {
                e.target.style.borderColor = '#ddd';
                // Usar a instância global criada em init.js
                e.target.title = window.pdfExtractor?.getPageRangesExample() || '';
            }
        });
    }
});
