// PDF Splitting Module
class PDFSplitter {
    constructor() {
        this.isProcessing = false;
        this.initializeSplitFeatures();
    }

    initializeSplitFeatures() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const splitBtn = document.getElementById('split-pdfs');
        const previewBtn = document.getElementById('preview-split');
        const splitModeRadios = document.querySelectorAll('input[name="split-mode"]');

        if (splitBtn) {
            splitBtn.addEventListener('click', () => this.splitPDFs());
        }

        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewSplit());
        }

        splitModeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateSplitOptions());
        });

        // Listen for files uploaded via general system
        document.addEventListener('filesUploaded', (e) => {
            if (CORE.getCurrentTab() === 'split') {
                this.handleGeneralFileUpload(e.detail);
            }
        });

        this.updateSplitOptions();
    }

    updateSplitOptions() {
        const splitMode = document.querySelector('input[name="split-mode"]:checked')?.value;
        const customOptions = document.getElementById('custom-split-options');

        if (customOptions) {
            customOptions.style.display = splitMode === 'custom' ? 'block' : 'none';
        }
    }

    handleGeneralFileUpload(files) {
        if (!files || files.length === 0) return;

        // Use the first file for split operation
        const file = files[0];

        if (file.type !== 'application/pdf') {
            UI.showToast('Por favor, selecione apenas arquivos PDF', 'error');
            return;
        }

        this.selectedFile = file;
        this.displayFileInfo(file);
        UI.addLog(`Arquivo selecionado para divisão: ${file.name}`);

        if (files.length > 1) {
            UI.showToast('Apenas o primeiro arquivo será usado para divisão', 'warning');
        }
    }

    async displayFileInfo(file) {
        const fileInfoContainer = document.getElementById('split-file-info');
        const fileName = document.getElementById('split-file-name');
        const fileSize = document.getElementById('split-file-size');
        const filePages = document.getElementById('split-file-pages');

        if (!fileInfoContainer) return;

        // Exibir informações básicas
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);

        // Tentar obter o número de páginas
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();
            filePages.textContent = `${pageCount} página${pageCount !== 1 ? 's' : ''}`;
        } catch (error) {
            console.warn('Erro ao obter informações do PDF:', error);
            filePages.textContent = 'Informação não disponível';
        }

        fileInfoContainer.classList.remove('hidden');
    }

    previewSplit() {
        if (!this.selectedFile) {
            UI.showToast('Selecione um arquivo PDF primeiro', 'warning');
            return;
        }

        const splitMode = document.querySelector('input[name="split-mode"]:checked')?.value || 'pages';
        const customRanges = document.getElementById('split-ranges')?.value;

        let previewText = '';
        switch (splitMode) {
            case 'pages':
                previewText = 'O PDF será dividido em páginas individuais.';
                break;
            case 'half':
                previewText = 'O PDF será dividido pela metade.';
                break;
            case 'custom':
                if (customRanges) {
                    previewText = `O PDF será dividido usando os intervalos: ${customRanges}`;
                } else {
                    previewText = 'Defina os intervalos customizados primeiro.';
                }
                break;
        }

        UI.showToast(previewText, 'info');
        UI.addLog(`Preview de divisão: ${previewText}`);
    }

    async splitPDFs() {
        console.log('splitPDFs() chamada');

        // Verificar se já está processando para evitar execução dupla
        if (this.isProcessing) {
            console.log('Já está processando, ignorando nova chamada');
            return;
        }

        this.isProcessing = true;

        // Verificar se há arquivo selecionado especificamente na aba de divisão
        let filesToProcess = [];

        if (this.selectedFile) {
            filesToProcess = [this.selectedFile];
            console.log('Usando selectedFile:', this.selectedFile.name);
        } else {
            // Fallback para arquivos do upload geral
            const uploadedFiles = CORE.getUploadedFiles().filter(file => file.type === 'application/pdf');
            if (uploadedFiles.length === 0) {
                UI.showToast('Nenhum arquivo PDF selecionado para divisão', 'warning');
                this.isProcessing = false;
                return;
            }
            // Para operação de split, usar apenas o primeiro arquivo
            filesToProcess = [uploadedFiles[0]];
            console.log('Usando uploadedFiles[0]:', uploadedFiles[0].name);

            if (uploadedFiles.length > 1) {
                UI.showToast('Apenas o primeiro arquivo será usado para divisão', 'warning');
            }
        }

        const splitMode = document.querySelector('input[name="split-mode"]:checked')?.value || 'pages';

        // Validar intervalos customizados se necessário
        if (splitMode === 'custom') {
            const customRanges = document.getElementById('split-ranges')?.value.trim();
            if (!customRanges) {
                UI.showToast('Por favor, defina os intervalos de páginas para divisão customizada', 'warning');
                return;
            }
        }

        UI.showProgress(0, 'Iniciando divisão dos PDFs...');

        try {
            for (let i = 0; i < filesToProcess.length; i++) {
                const file = filesToProcess[i];
                const progress = ((i + 1) / filesToProcess.length) * 100;

                UI.showProgress(progress, `Dividindo ${file.name}...`);

                await this.processSinglePDF(file, splitMode);

                UI.addLog(`PDF dividido: ${file.name}`);

                // Pequena pausa para não sobrecarregar
                await this.sleep(200);
            }

            UI.hideProgress();
            UI.showToast(`Divisão concluída! ${filesToProcess.length} arquivo(s) processado(s)`, 'success');

        } catch (error) {
            console.error('Erro na divisão de PDFs:', error);
            UI.hideProgress();
            UI.showToast('Erro durante a divisão dos PDFs', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    async processSinglePDF(file, splitMode) {
        try {
            // Carregar o PDF usando PDF-lib
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            UI.addLog(`PDF carregado: ${file.name} (${totalPages} páginas)`);

            switch (splitMode) {
                case 'pages':
                    await this.splitByPages(pdfDoc, file.name, totalPages);
                    break;
                case 'half':
                    await this.splitInHalf(pdfDoc, file.name, totalPages);
                    break;
                case 'custom':
                    await this.splitCustom(pdfDoc, file.name, totalPages);
                    break;
                default:
                    await this.splitByPages(pdfDoc, file.name, totalPages);
            }

        } catch (error) {
            console.error(`Erro ao processar ${file.name}:`, error);
            throw error;
        }
    }

    async splitByPages(pdfDoc, originalName, totalPages) {
        const baseName = originalName.replace('.pdf', '');

        for (let i = 0; i < totalPages; i++) {
            const newPdf = await PDFLib.PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(copiedPage);

            const pdfBytes = await newPdf.save();
            const fileName = `${baseName}_página_${i + 1}.pdf`;

            this.downloadPDF(pdfBytes, fileName);
            UI.addLog(`Página criada: ${fileName}`);
        }
    }

    async splitInHalf(pdfDoc, originalName, totalPages) {
        const baseName = originalName.replace('.pdf', '');
        const midPoint = Math.ceil(totalPages / 2);

        // Primeira metade
        const firstHalf = await PDFLib.PDFDocument.create();
        const firstHalfPages = await firstHalf.copyPages(pdfDoc, Array.from({ length: midPoint }, (_, i) => i));
        firstHalfPages.forEach(page => firstHalf.addPage(page));

        const firstHalfBytes = await firstHalf.save();
        const firstFileName = `${baseName}_parte_1.pdf`;
        this.downloadPDF(firstHalfBytes, firstFileName);

        let secondFileName = null;

        // Segunda metade
        if (totalPages > midPoint) {
            const secondHalf = await PDFLib.PDFDocument.create();
            const secondHalfPages = await secondHalf.copyPages(pdfDoc, Array.from({ length: totalPages - midPoint }, (_, i) => i + midPoint));
            secondHalfPages.forEach(page => secondHalf.addPage(page));

            const secondHalfBytes = await secondHalf.save();
            secondFileName = `${baseName}_parte_2.pdf`;
            this.downloadPDF(secondHalfBytes, secondFileName);
        }

        UI.addLog(`PDF dividido em 2 partes: ${firstFileName}, ${secondFileName || 'N/A'}`);
    }

    async splitCustom(pdfDoc, originalName, totalPages) {
        const rangesInput = document.getElementById('split-ranges')?.value || '';

        if (!rangesInput.trim()) {
            UI.showToast('Por favor, especifique os intervalos de páginas', 'warning');
            return;
        }

        const baseName = originalName.replace('.pdf', '');
        const ranges = this.parsePageRanges(rangesInput, totalPages);

        if (ranges.length === 0) {
            UI.showToast('Intervalos de páginas inválidos', 'error');
            return;
        }

        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const newPdf = await PDFLib.PDFDocument.create();

            const pageIndices = [];
            for (let page = range.start; page <= range.end; page++) {
                pageIndices.push(page - 1); // PDF-lib usa índices baseados em 0
            }

            const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const fileName = `${baseName}_páginas_${range.start}-${range.end}.pdf`;

            this.downloadPDF(pdfBytes, fileName);
            UI.addLog(`Intervalo criado: ${fileName}`);
        }
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

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Método auxiliar para validar intervalos
    validatePageRanges(rangesInput, totalPages) {
        try {
            const ranges = this.parsePageRanges(rangesInput, totalPages);
            return ranges.length > 0;
        } catch (error) {
            return false;
        }
    }

    // Método para obter exemplo de formato de intervalos
    getPageRangesExample() {
        return "Exemplos: 1-5, 7, 10-15, 20";
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Inicializar quando o DOM estiver pronto
let pdfSplitter;
document.addEventListener('DOMContentLoaded', () => {
    pdfSplitter = new PDFSplitter();
});

// Adicionar validação em tempo real para intervalos customizados
document.addEventListener('DOMContentLoaded', () => {
    const rangesInput = document.getElementById('split-ranges');
    if (rangesInput) {
        rangesInput.addEventListener('input', (e) => {
            const value = e.target.value;
            // Adicionar feedback visual para formato válido/inválido
            if (value.trim()) {
                e.target.style.borderColor = '#ddd';
                e.target.title = pdfSplitter?.getPageRangesExample() || '';
            }
        });
    }
});
