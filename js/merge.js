// PDF Merging Module
class PDFMerger {
    constructor() {
        this.initializeMergeFeatures();
    }

    initializeMergeFeatures() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const mergeBtn = document.getElementById('merge-pdfs');
        const orderSelect = document.getElementById('merge-order');

        if (mergeBtn) {
            mergeBtn.addEventListener('click', () => this.mergePDFs());
        }

        if (orderSelect) {
            orderSelect.addEventListener('change', () => this.updateMergePreview());
        }

        // Atualizar preview quando arquivos forem carregados
        document.addEventListener('filesUploaded', () => this.updateMergePreview());
    }

    updateMergePreview() {
        const files = CORE.getUploadedFiles().filter(file => file.type === 'application/pdf');
        const previewContainer = document.getElementById('merge-preview');

        if (!previewContainer) return;

        if (files.length === 0) {
            previewContainer.innerHTML = '<p class="no-files">Nenhum PDF carregado para mesclagem</p>';
            return;
        }

        const orderMode = document.getElementById('merge-order')?.value || 'original';
        const orderedFiles = this.orderFiles(files, orderMode);

        previewContainer.innerHTML = `
            <h4>Ordem de mesclagem (${orderedFiles.length} arquivo${orderedFiles.length !== 1 ? 's' : ''}):</h4>
            <div class="merge-file-list">
                ${orderedFiles.map((file, index) => `
                    <div class="merge-file-item" data-index="${index}">
                        <span class="file-number">${index + 1}</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    orderFiles(files, orderMode) {
        const filesCopy = [...files];

        switch (orderMode) {
            case 'alphabetical':
                return filesCopy.sort((a, b) => a.name.localeCompare(b.name));
            case 'size-asc':
                return filesCopy.sort((a, b) => a.size - b.size);
            case 'size-desc':
                return filesCopy.sort((a, b) => b.size - a.size);
            case 'date-asc':
                return filesCopy.sort((a, b) => a.lastModified - b.lastModified);
            case 'date-desc':
                return filesCopy.sort((a, b) => b.lastModified - a.lastModified);
            default:
                return filesCopy; // Ordem original
        }
    }

    async mergePDFs() {
        const files = CORE.getUploadedFiles().filter(file => file.type === 'application/pdf');

        if (files.length < 2) {
            UI.showToast('São necessários pelo menos 2 arquivos PDF para mesclar', 'warning');
            return;
        }

        const orderMode = document.getElementById('merge-order')?.value || 'original';
        const orderedFiles = this.orderFiles(files, orderMode);

        UI.showProgress(0, 'Iniciando mesclagem dos PDFs...');

        try {
            // Criar novo documento PDF
            const mergedPdf = await PDFLib.PDFDocument.create();
            let totalPagesAdded = 0;

            for (let i = 0; i < orderedFiles.length; i++) {
                const file = orderedFiles[i];
                const progress = ((i + 1) / orderedFiles.length) * 80; // 80% para carregamento

                UI.showProgress(progress, `Processando ${file.name}...`);

                try {
                    // Carregar o PDF
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                    const pageCount = pdf.getPageCount();

                    // Copiar todas as páginas
                    const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
                    const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);

                    // Adicionar páginas ao documento mesclado
                    copiedPages.forEach(page => mergedPdf.addPage(page));

                    totalPagesAdded += pageCount;
                    UI.addLog(`Arquivo adicionado: ${file.name} (${pageCount} páginas)`);

                } catch (error) {
                    console.error(`Erro ao processar ${file.name}:`, error);
                    UI.addLog(`Erro ao processar ${file.name}: ${error.message}`, 'error');
                    // Continuar com os outros arquivos
                }

                // Pequena pausa para não sobrecarregar
                await this.sleep(100);
            }

            if (totalPagesAdded === 0) {
                throw new Error('Nenhuma página foi adicionada ao documento mesclado');
            }

            UI.showProgress(90, 'Finalizando documento mesclado...');

            // Gerar o PDF final
            const pdfBytes = await mergedPdf.save();

            // Gerar nome do arquivo final
            const mergedFileName = this.generateMergedFileName(orderedFiles);

            UI.showProgress(100, 'Download iniciado...');

            // Fazer download
            this.downloadPDF(pdfBytes, mergedFileName);

            UI.hideProgress();
            UI.showToast(`Mesclagem concluída! ${orderedFiles.length} arquivo(s) mesclados em ${totalPagesAdded} páginas`, 'success');
            UI.addLog(`PDF mesclado criado: ${mergedFileName} (${totalPagesAdded} páginas total)`);

        } catch (error) {
            console.error('Erro na mesclagem de PDFs:', error);
            UI.hideProgress();
            UI.showToast(`Erro durante a mesclagem dos PDFs: ${error.message}`, 'error');
        }
    }

    generateMergedFileName(files) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

        if (files.length <= 3) {
            // Para poucos arquivos, usar nomes dos arquivos
            const names = files.map(f => f.name.replace('.pdf', '')).join('_');
            return `${names}_mesclado_${timestamp}.pdf`;
        } else {
            // Para muitos arquivos, usar quantidade e timestamp
            return `${files.length}_PDFs_mesclados_${timestamp}.pdf`;
        }
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

    // Método para reordenar arquivos manualmente (drag and drop futuro)
    reorderFiles(fromIndex, toIndex) {
        const files = CORE.getUploadedFiles().filter(file => file.type === 'application/pdf');

        if (fromIndex >= 0 && fromIndex < files.length && toIndex >= 0 && toIndex < files.length) {
            const [movedFile] = files.splice(fromIndex, 1);
            files.splice(toIndex, 0, movedFile);

            // Atualizar a lista de arquivos no CORE
            // (Isso seria implementado no core.js para permitir reordenação)
            this.updateMergePreview();
        }
    }

    // Método para validar se todos os arquivos são PDFs válidos
    async validatePDFs(files) {
        const results = [];

        for (const file of files) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const pageCount = pdf.getPageCount();

                results.push({
                    file: file,
                    valid: true,
                    pageCount: pageCount,
                    error: null
                });
            } catch (error) {
                results.push({
                    file: file,
                    valid: false,
                    pageCount: 0,
                    error: error.message
                });
            }
        }

        return results;
    }

    // Método para obter estatísticas dos arquivos para mesclagem
    getMergeStatistics(files) {
        const stats = {
            totalFiles: files.length,
            totalSize: files.reduce((sum, file) => sum + file.size, 0),
            averageSize: 0,
            largestFile: null,
            smallestFile: null
        };

        if (files.length > 0) {
            stats.averageSize = stats.totalSize / files.length;
            stats.largestFile = files.reduce((largest, file) =>
                file.size > largest.size ? file : largest
            );
            stats.smallestFile = files.reduce((smallest, file) =>
                file.size < smallest.size ? file : smallest
            );
        }

        return stats;
    }
}

// Inicializar quando o DOM estiver pronto

