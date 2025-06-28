// PDF Splitting Module
// CORREÇÃO: Removida inicialização duplicada para evitar event listeners duplos
// e consequente download duplicado de arquivos (Bug corrigido em 27/06/2025)
// MELHORIAS: Adicionada sanitização de nomes de arquivo, melhor tratamento de erros
// e continuidade de processamento mesmo com falhas em arquivos individuais
class PDFSplitter {
    constructor() {
        console.log('🔧 Inicializando PDFSplitter...');
        this.isProcessing = false;
        this.initializeSplitFeatures();
        console.log('✅ PDFSplitter inicializado com sucesso!');
    }

    initializeSplitFeatures() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const splitBtn = document.getElementById('split-pdfs');
        const splitModeRadios = document.querySelectorAll('input[name="split-mode"]');

        if (splitBtn) {
            splitBtn.addEventListener('click', () => this.splitPDFs());
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
        console.log('🔍 Iniciando displayFileInfo para:', file.name);

        // Aguardar um pouco para garantir que o DOM está pronto
        await new Promise(resolve => setTimeout(resolve, 100));

        const fileInfoContainer = document.getElementById('split-file-info');
        const fileName = document.getElementById('split-file-name');
        const fileSize = document.getElementById('split-file-size');
        const filePages = document.getElementById('split-file-pages');

        console.log('🔍 Elementos encontrados:', {
            fileInfoContainer: !!fileInfoContainer,
            fileName: !!fileName,
            fileSize: !!fileSize,
            filePages: !!filePages
        });

        if (!fileInfoContainer) {
            console.warn('❌ Container split-file-info não encontrado');
            return;
        }

        // Verificar se todos os elementos necessários existem
        if (!fileName || !fileSize || !filePages) {
            console.warn('❌ Alguns elementos de informação do arquivo não foram encontrados:', {
                fileName: !!fileName,
                fileSize: !!fileSize,
                filePages: !!filePages
            });
            return;
        }

        // Exibir informações básicas
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);

        console.log(`📄 Exibindo informações para: ${file.name}`);

        // Tentar obter o número de páginas
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();
            filePages.textContent = `${pageCount} página${pageCount !== 1 ? 's' : ''}`;
            console.log(`📊 PDF carregado: ${pageCount} página(s)`);
        } catch (error) {
            console.warn('⚠️ Erro ao obter informações do PDF:', error);
            filePages.textContent = 'Informação não disponível';
        }

        fileInfoContainer.classList.remove('hidden');
        console.log('✅ Informações do arquivo exibidas com sucesso');
    }

    async splitPDFs() {
        console.log('splitPDFs() chamada');

        // Verificar se já está processando para evitar execução dupla
        if (this.isProcessing) {
            console.log('Já está processando, ignorando nova chamada');
            return;
        }

        this.isProcessing = true;

        try {
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

            let processedCount = 0;
            let errorCount = 0;

            for (let i = 0; i < filesToProcess.length; i++) {
                const file = filesToProcess[i];
                const progress = ((i + 1) / filesToProcess.length) * 100;

                UI.showProgress(progress, `Dividindo ${file.name}...`);

                try {
                    await this.processSinglePDF(file, splitMode);
                    UI.addLog(`✅ PDF dividido com sucesso: ${file.name}`);
                    processedCount++;
                } catch (error) {
                    console.error(`Erro ao processar ${file.name}:`, error);
                    UI.addLog(`❌ Erro ao processar ${file.name}: ${error.message}`);
                    errorCount++;
                }

                // Pequena pausa para não sobrecarregar
                await this.sleep(200);
            }

            UI.hideProgress();

            if (errorCount === 0) {
                UI.showToast(`Divisão concluída! ${processedCount} arquivo(s) processado(s)`, 'success');
            } else {
                UI.showToast(`Divisão concluída com erros: ${processedCount} sucesso(s), ${errorCount} erro(s)`, 'warning');
            }

        } catch (error) {
            console.error('Erro geral na divisão de PDFs:', error);
            UI.hideProgress();
            UI.showToast('Erro crítico durante a divisão dos PDFs', 'error');
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

    // Função auxiliar para sanitizar nomes de arquivo
    sanitizeFileName(fileName) {
        // Remove ou substitui caracteres problemáticos
        return fileName
            .replace(/[<>:"\/\\|?*]/g, '_')  // Caracteres não permitidos no Windows
            .replace(/\s+/g, '_')           // Espaços por underscores
            .replace(/[áàâãä]/g, 'a')       // Acentos
            .replace(/[éèêë]/g, 'e')
            .replace(/[íìîï]/g, 'i')
            .replace(/[óòôõö]/g, 'o')
            .replace(/[úùûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[ñ]/g, 'n')
            .replace(/[ÁÀÂÃÄ]/g, 'A')
            .replace(/[ÉÈÊË]/g, 'E')
            .replace(/[ÍÌÎÏ]/g, 'I')
            .replace(/[ÓÒÔÕÖ]/g, 'O')
            .replace(/[ÚÙÛÜ]/g, 'U')
            .replace(/[Ç]/g, 'C')
            .replace(/[Ñ]/g, 'N')
            .replace(/_{2,}/g, '_')         // Múltiplos underscores por um só
            .replace(/^_|_$/g, '')         // Remove underscores do início e fim
            .substring(0, 200);            // Limita o tamanho do nome
    }

    async splitByPages(pdfDoc, originalName, totalPages) {
        const baseName = this.sanitizeFileName(originalName.replace('.pdf', ''));
        UI.addLog(`Iniciando divisão por páginas: ${totalPages} página(s)`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < totalPages; i++) {
            try {
                // Criar novo PDF para esta página
                const newPdf = await PDFLib.PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
                newPdf.addPage(copiedPage);

                // Gerar o PDF
                const pdfBytes = await newPdf.save();
                const fileName = `${baseName}_pagina_${i + 1}.pdf`;

                // Download do arquivo
                this.downloadPDF(pdfBytes, fileName);
                successCount++;

                // Log de progresso
                UI.addLog(`Página ${i + 1}/${totalPages} criada: ${fileName}`);

                // Atualizar progresso
                const pageProgress = ((i + 1) / totalPages) * 100;
                UI.showProgress(pageProgress, `Criando página ${i + 1} de ${totalPages}...`);

                // Pequena pausa para não sobrecarregar o navegador
                if (i < totalPages - 1) {
                    await this.sleep(100);
                }

            } catch (error) {
                errorCount++;
                console.error(`Erro ao processar página ${i + 1}:`, error);
                UI.addLog(`❌ Erro na página ${i + 1}: ${error.message}`);

                // Continuar processando outras páginas mesmo com erro
                continue;
            }
        }

        UI.addLog(`✅ Divisão por páginas concluída: ${successCount} arquivo(s) criado(s), ${errorCount} erro(s)`);

        if (errorCount > 0) {
            UI.showToast(`Divisão concluída com ${errorCount} erro(s). Verifique os logs.`, 'warning');
        }
    }

    async splitInHalf(pdfDoc, originalName, totalPages) {
        const baseName = this.sanitizeFileName(originalName.replace('.pdf', ''));
        const midPoint = Math.ceil(totalPages / 2);

        UI.addLog(`Iniciando divisão pela metade: ${totalPages} páginas (${midPoint} + ${totalPages - midPoint})`);

        try {
            // Primeira metade (páginas 1 até midPoint)
            UI.showProgress(25, 'Criando primeira metade...');
            const firstHalf = await PDFLib.PDFDocument.create();
            const firstHalfPages = await firstHalf.copyPages(pdfDoc, Array.from({ length: midPoint }, (_, i) => i));
            firstHalfPages.forEach(page => firstHalf.addPage(page));

            const firstHalfBytes = await firstHalf.save();
            const firstFileName = `${baseName}_parte_1.pdf`;
            this.downloadPDF(firstHalfBytes, firstFileName);
            UI.addLog(`✅ Primeira metade criada: ${firstFileName} (páginas 1-${midPoint})`);

            let secondFileName = null;

            // Segunda metade (páginas midPoint+1 até totalPages)
            if (totalPages > midPoint) {
                UI.showProgress(75, 'Criando segunda metade...');
                const secondHalf = await PDFLib.PDFDocument.create();
                const remainingPages = totalPages - midPoint;
                const secondHalfPages = await secondHalf.copyPages(pdfDoc, Array.from({ length: remainingPages }, (_, i) => i + midPoint));
                secondHalfPages.forEach(page => secondHalf.addPage(page));

                const secondHalfBytes = await secondHalf.save();
                secondFileName = `${baseName}_parte_2.pdf`;
                this.downloadPDF(secondHalfBytes, secondFileName);
                UI.addLog(`✅ Segunda metade criada: ${secondFileName} (páginas ${midPoint + 1}-${totalPages})`);
            } else {
                UI.addLog(`ℹ️ PDF tem apenas ${totalPages} página(s), segunda metade não necessária`);
            }

            const resultMessage = secondFileName
                ? `PDF dividido em 2 partes: ${firstFileName}, ${secondFileName}`
                : `PDF dividido em 1 parte: ${firstFileName}`;

            UI.addLog(`✅ ${resultMessage}`);

        } catch (error) {
            console.error('Erro na divisão pela metade:', error);
            UI.addLog(`❌ Erro na divisão pela metade: ${error.message}`);
            throw new Error(`Falha na divisão pela metade: ${error.message}`);
        }
    }

    async splitCustom(pdfDoc, originalName, totalPages) {
        const rangesInput = document.getElementById('split-ranges')?.value || '';

        if (!rangesInput.trim()) {
            UI.showToast('Por favor, especifique os intervalos de páginas', 'warning');
            throw new Error('Intervalos de páginas não especificados');
        }

        const baseName = this.sanitizeFileName(originalName.replace('.pdf', ''));
        const ranges = this.parsePageRanges(rangesInput, totalPages);

        if (ranges.length === 0) {
            UI.showToast('Intervalos de páginas inválidos', 'error');
            throw new Error('Intervalos de páginas inválidos');
        }

        UI.addLog(`Iniciando divisão customizada: ${ranges.length} intervalo(s) definido(s)`);

        // Log dos intervalos que serão processados
        ranges.forEach((range, index) => {
            if (range.start === range.end) {
                UI.addLog(`  ${index + 1}. Página ${range.start}`);
            } else {
                UI.addLog(`  ${index + 1}. Páginas ${range.start}-${range.end}`);
            }
        });

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < ranges.length; i++) {
            try {
                const range = ranges[i];
                const progress = ((i + 1) / ranges.length) * 100;

                UI.showProgress(progress, `Processando intervalo ${i + 1} de ${ranges.length}...`);

                // Criar novo PDF para este intervalo
                const newPdf = await PDFLib.PDFDocument.create();

                // Construir lista de índices de páginas (baseado em 0)
                const pageIndices = [];
                for (let page = range.start; page <= range.end; page++) {
                    if (page >= 1 && page <= totalPages) {
                        pageIndices.push(page - 1); // PDF-lib usa índices baseados em 0
                    }
                }

                if (pageIndices.length === 0) {
                    UI.addLog(`⚠️ Intervalo ${range.start}-${range.end} está fora do alcance (1-${totalPages}), ignorando`);
                    continue;
                }

                // Copiar páginas para o novo PDF
                const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
                copiedPages.forEach(page => newPdf.addPage(page));

                // Gerar o PDF
                const pdfBytes = await newPdf.save();

                // Gerar nome do arquivo apropriado (com sanitização)
                const fileName = range.start === range.end
                    ? `${baseName}_pagina_${range.start}.pdf`
                    : `${baseName}_paginas_${range.start}-${range.end}.pdf`;

                // Download do arquivo
                this.downloadPDF(pdfBytes, fileName);
                successCount++;

                UI.addLog(`✅ Intervalo ${i + 1}/${ranges.length} criado: ${fileName}`);

                // Pequena pausa para não sobrecarregar
                if (i < ranges.length - 1) {
                    await this.sleep(100);
                }

            } catch (error) {
                errorCount++;
                console.error(`Erro ao processar intervalo ${i + 1}:`, error);
                UI.addLog(`❌ Erro no intervalo ${i + 1}: ${error.message}`);

                // Continuar processando outros intervalos mesmo com erro
                continue;
            }
        }

        UI.addLog(`✅ Divisão customizada concluída: ${successCount} arquivo(s) criado(s), ${errorCount} erro(s)`);

        if (errorCount > 0) {
            UI.showToast(`Divisão concluída com ${errorCount} erro(s). Verifique os logs.`, 'warning');
        }
    }

    parsePageRanges(rangesInput, totalPages) {
        const ranges = [];
        const parts = rangesInput.split(',');

        for (const part of parts) {
            const trimmed = part.trim();

            if (!trimmed) continue; // Ignorar partes vazias

            try {
                if (trimmed.includes('-')) {
                    // Intervalo (ex: "1-5", "10-15")
                    const [startStr, endStr] = trimmed.split('-').map(s => s.trim());
                    const start = parseInt(startStr);
                    const end = parseInt(endStr);

                    // Validações
                    if (isNaN(start) || isNaN(end)) {
                        UI.addLog(`⚠️ Intervalo inválido ignorado: "${trimmed}" (números inválidos)`);
                        continue;
                    }

                    if (start > end) {
                        UI.addLog(`⚠️ Intervalo inválido ignorado: "${trimmed}" (início maior que fim)`);
                        continue;
                    }

                    if (start < 1 || end > totalPages) {
                        UI.addLog(`⚠️ Intervalo fora do alcance ignorado: "${trimmed}" (páginas válidas: 1-${totalPages})`);
                        continue;
                    }

                    ranges.push({ start, end });

                } else {
                    // Página única (ex: "7", "12")
                    const page = parseInt(trimmed);

                    if (isNaN(page)) {
                        UI.addLog(`⚠️ Página inválida ignorada: "${trimmed}" (não é um número)`);
                        continue;
                    }

                    if (page < 1 || page > totalPages) {
                        UI.addLog(`⚠️ Página fora do alcance ignorada: "${trimmed}" (páginas válidas: 1-${totalPages})`);
                        continue;
                    }

                    ranges.push({ start: page, end: page });
                }

            } catch (error) {
                UI.addLog(`⚠️ Erro ao processar intervalo "${trimmed}": ${error.message}`);
                continue;
            }
        }

        // Remover duplicatas e ordenar
        const uniqueRanges = this.removeDuplicateRanges(ranges);
        return uniqueRanges.sort((a, b) => a.start - b.start);
    }

    // Função auxiliar para remover intervalos duplicados
    removeDuplicateRanges(ranges) {
        const seen = new Set();
        return ranges.filter(range => {
            const key = `${range.start}-${range.end}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    downloadPDF(pdfBytes, fileName) {
        try {
            console.log(`🔽 Iniciando download: ${fileName}`);
            UI.addLog(`📥 Download iniciado: ${fileName}`);

            // Verificar se o nome do arquivo é válido
            if (!fileName || fileName.trim() === '') {
                throw new Error('Nome do arquivo inválido');
            }

            // Garantir que termina com .pdf
            const sanitizedFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

            const blob = new Blob([pdfBytes], { type: 'application/pdf' });

            // Verificar se o blob foi criado corretamente
            if (!blob || blob.size === 0) {
                throw new Error('Erro ao criar arquivo PDF');
            }

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = sanitizedFileName;

            // Adicionar ao DOM temporariamente
            document.body.appendChild(link);
            link.click();

            // Limpeza
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            console.log(`✅ Download concluído: ${sanitizedFileName}`);

        } catch (error) {
            console.error(`❌ Erro no download de ${fileName}:`, error);
            UI.addLog(`❌ Erro no download de ${fileName}: ${error.message}`);
            throw error;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Método auxiliar para validar intervalos
    validatePageRanges(rangesInput, totalPages) {
        try {
            if (!rangesInput || !rangesInput.trim()) {
                return { valid: false, message: 'Nenhum intervalo especificado' };
            }

            const ranges = this.parsePageRanges(rangesInput, totalPages);

            if (ranges.length === 0) {
                return { valid: false, message: 'Nenhum intervalo válido encontrado' };
            }

            return { valid: true, ranges, message: `${ranges.length} intervalo(s) válido(s)` };
        } catch (error) {
            return { valid: false, message: `Erro na validação: ${error.message}` };
        }
    }

    // Método para obter exemplo de formato de intervalos
    getPageRangesExample() {
        return "Exemplos: 1-5, 7, 10-15, 20";
    }

    // Método para gerar preview dos intervalos
    previewPageRanges(rangesInput, totalPages) {
        const validation = this.validatePageRanges(rangesInput, totalPages);

        if (!validation.valid) {
            return `❌ ${validation.message}`;
        }

        const ranges = validation.ranges;
        const preview = ranges.map(range => {
            if (range.start === range.end) {
                return `página ${range.start}`;
            } else {
                return `páginas ${range.start}-${range.end}`;
            }
        }).join(', ');

        return `✅ Serão criados ${ranges.length} arquivo(s): ${preview}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Função de teste para verificar disponibilidade dos elementos
function testSplitElements() {
    console.log('🧪 Testando disponibilidade dos elementos da aba Split...');

    const elements = {
        'split-file-info': document.getElementById('split-file-info'),
        'split-file-name': document.getElementById('split-file-name'),
        'split-file-size': document.getElementById('split-file-size'),
        'split-file-pages': document.getElementById('split-file-pages'),
        'split-pdfs': document.getElementById('split-pdfs')
    };

    console.log('📊 Resultados do teste:');
    Object.entries(elements).forEach(([id, element]) => {
        const status = element ? '✅' : '❌';
        console.log(`${status} ${id}: ${!!element}`);
    });

    console.log('🧪 Teste de elementos concluído!');
    return elements;
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const rangesInput = document.getElementById('split-ranges');
    if (rangesInput) {
        rangesInput.addEventListener('input', (e) => {
            const value = e.target.value;
            // Adicionar feedback visual para formato válido/inválido
            if (value.trim()) {
                e.target.style.borderColor = '#ddd';
                // Usar a instância global do pdfSplitter criada em init.js
                e.target.title = window.pdfSplitter?.getPageRangesExample() || '';
            }
        });
    }

    // Executar teste se estiver em modo debug
    if (window.location.search.includes('debug=true')) {
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', testSplitElements);
        } else {
            testSplitElements();
        }
    }
});
