// PDF Page Extraction Module
class PDFExtractor {
    constructor() {
        console.log('🔧 Inicializando PDFExtractor...');
        this.initializeExtractFeatures();
        console.log('✅ PDFExtractor inicializado com sucesso!');
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

        console.log(`🚀 Iniciando extração de páginas em ${files.length} arquivo(s) no modo: ${extractMode}`);
        UI.showProgress(0, 'Iniciando extração de páginas...');

        try {
            let totalExtracted = 0;
            let successfulFiles = 0;
            let failedFiles = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progress = ((i + 1) / files.length) * 100;

                UI.showProgress(progress, `Extraindo de ${file.name}...`);

                try {
                    const extracted = await this.processSinglePDFExtraction(file, extractMode);
                    totalExtracted += extracted;
                    successfulFiles++;

                    UI.addLog(`✅ Páginas extraídas de ${file.name}: ${extracted}`);
                    console.log(`✅ Arquivo ${file.name} processado: ${extracted} página(s) extraída(s)`);

                } catch (error) {
                    failedFiles++;
                    console.error(`❌ Erro ao processar ${file.name}:`, error);
                    UI.addLog(`❌ Erro ao processar ${file.name}: ${error.message}`);
                    
                    // Continuar com o próximo arquivo
                    continue;
                }

                // Pequena pausa para não sobrecarregar
                await this.sleep(200);
            }

            UI.hideProgress();
            
            // Resumo final
            const summary = [];
            if (successfulFiles > 0) {
                summary.push(`${totalExtracted} página(s) extraída(s) de ${successfulFiles} arquivo(s)`);
            }
            if (failedFiles > 0) {
                summary.push(`${failedFiles} arquivo(s) com erro`);
            }

            const message = `Extração concluída! ${summary.join(' - ')}`;
            
            if (failedFiles === 0) {
                UI.showToast(message, 'success');
            } else if (successfulFiles > 0) {
                UI.showToast(message, 'warning');
            } else {
                UI.showToast('Todos os arquivos falharam na extração', 'error');
            }

            console.log(`🏁 Extração finalizada: ${message}`);

        } catch (error) {
            console.error('❌ Erro geral na extração de páginas:', error);
            UI.hideProgress();
            UI.showToast('Erro durante a extração de páginas', 'error');
        }
    }

    async processSinglePDFExtraction(file, extractMode) {
        try {
            console.log(`🔄 Processando ${file.name} no modo: ${extractMode}`);
            
            // Carregar o PDF usando PDF-lib
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            console.log(`📖 PDF carregado: ${file.name} (${totalPages} páginas)`);
            UI.addLog(`PDF carregado: ${file.name} (${totalPages} páginas)`);

            if (totalPages === 0) {
                console.log(`⚠️ PDF ${file.name} não tem páginas`);
                UI.addLog(`Aviso: ${file.name} não tem páginas para extrair`);
                return 0;
            }

            let extractedCount = 0;

            switch (extractMode) {
                case 'first':
                    console.log(`🔸 Extraindo primeira página de ${file.name}`);
                    extractedCount = await this.extractFirstPage(pdfDoc, file.name);
                    break;
                case 'last':
                    console.log(`🔹 Extraindo última página de ${file.name}`);
                    extractedCount = await this.extractLastPage(pdfDoc, file.name, totalPages);
                    break;
                case 'odd':
                    console.log(`🔸 Extraindo páginas ímpares de ${file.name}`);
                    extractedCount = await this.extractOddPages(pdfDoc, file.name, totalPages);
                    break;
                case 'even':
                    console.log(`🔹 Extraindo páginas pares de ${file.name}`);
                    extractedCount = await this.extractEvenPages(pdfDoc, file.name, totalPages);
                    break;
                case 'custom':
                    console.log(`🎯 Extraindo páginas customizadas de ${file.name}`);
                    extractedCount = await this.extractCustomPages(pdfDoc, file.name, totalPages);
                    break;
                default:
                    console.log(`⚠️ Modo não reconhecido: ${extractMode}, usando primeira página`);
                    extractedCount = await this.extractFirstPage(pdfDoc, file.name);
            }

            console.log(`✅ Extração de ${file.name} concluída: ${extractedCount} página(s)`);
            return extractedCount;

        } catch (error) {
            console.error(`❌ Erro ao processar ${file.name}:`, error);
            UI.addLog(`Erro ao processar ${file.name}: ${error.message}`);
            throw error;
        }
    }

    async extractFirstPage(pdfDoc, originalName) {
        console.log(`🔢 Extraindo primeira página de ${originalName}`);
        
        const totalPages = pdfDoc.getPageCount();
        if (totalPages === 0) {
            console.log('⚠️ PDF não tem páginas');
            return 0;
        }

        try {
            const newPdf = await PDFLib.PDFDocument.create();
            const [firstPage] = await newPdf.copyPages(pdfDoc, [0]);
            newPdf.addPage(firstPage);

            console.log(`✅ Primeira página copiada com sucesso`);

            const pdfBytes = await newPdf.save();
            const baseName = originalName.replace(/\.pdf$/i, '');
            const fileName = `${baseName}_primeira_página.pdf`;

            this.downloadPDF(pdfBytes, fileName);
            
            const message = `Primeira página extraída: ${fileName}`;
            UI.addLog(message);
            console.log(`✅ ${message}`);

            return 1;
        } catch (error) {
            console.error(`❌ Erro ao extrair primeira página de ${originalName}:`, error);
            throw error;
        }
    }

    async extractLastPage(pdfDoc, originalName, totalPages) {
        console.log(`🔢 Extraindo última página de ${originalName} (página ${totalPages})`);
        
        if (totalPages === 0) {
            console.log('⚠️ PDF não tem páginas');
            return 0;
        }

        try {
            const newPdf = await PDFLib.PDFDocument.create();
            const [lastPage] = await newPdf.copyPages(pdfDoc, [totalPages - 1]);
            newPdf.addPage(lastPage);

            console.log(`✅ Última página copiada com sucesso`);

            const pdfBytes = await newPdf.save();
            const baseName = originalName.replace(/\.pdf$/i, '');
            const fileName = `${baseName}_última_página.pdf`;

            this.downloadPDF(pdfBytes, fileName);
            
            const message = `Última página extraída: ${fileName}`;
            UI.addLog(message);
            console.log(`✅ ${message}`);

            return 1;
        } catch (error) {
            console.error(`❌ Erro ao extrair última página de ${originalName}:`, error);
            throw error;
        }
    }

    async extractOddPages(pdfDoc, originalName, totalPages) {
        console.log(`🔢 Extraindo páginas ímpares de ${originalName} (${totalPages} páginas total)`);
        
        const oddPageIndices = [];
        // Páginas ímpares: 1, 3, 5, 7... (índices 0, 2, 4, 6...)
        for (let i = 0; i < totalPages; i += 2) {
            oddPageIndices.push(i);
        }

        console.log(`📝 Índices das páginas ímpares:`, oddPageIndices);
        console.log(`📊 Páginas ímpares a extrair: ${oddPageIndices.map(idx => idx + 1).join(', ')}`);

        if (oddPageIndices.length === 0) {
            console.log('⚠️ Nenhuma página ímpar encontrada');
            return 0;
        }

        try {
            const newPdf = await PDFLib.PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdfDoc, oddPageIndices);
            
            console.log(`✅ ${copiedPages.length} páginas copiadas com sucesso`);
            
            copiedPages.forEach((page, index) => {
                newPdf.addPage(page);
                console.log(`📄 Página ${oddPageIndices[index] + 1} adicionada ao novo PDF`);
            });

            const pdfBytes = await newPdf.save();
            const baseName = originalName.replace(/\.pdf$/i, '');
            const fileName = `${baseName}_páginas_ímpares.pdf`;

            this.downloadPDF(pdfBytes, fileName);
            
            const message = `Páginas ímpares extraídas: ${fileName} (${oddPageIndices.length} páginas: ${oddPageIndices.map(idx => idx + 1).join(', ')})`;
            UI.addLog(message);
            console.log(`✅ ${message}`);

            return oddPageIndices.length;
        } catch (error) {
            console.error(`❌ Erro ao extrair páginas ímpares de ${originalName}:`, error);
            throw error;
        }
    }

    async extractEvenPages(pdfDoc, originalName, totalPages) {
        console.log(`🔢 Extraindo páginas pares de ${originalName} (${totalPages} páginas total)`);
        
        const evenPageIndices = [];
        // Páginas pares: 2, 4, 6, 8... (índices 1, 3, 5, 7...)
        for (let i = 1; i < totalPages; i += 2) {
            evenPageIndices.push(i);
        }

        console.log(`📝 Índices das páginas pares:`, evenPageIndices);
        console.log(`📊 Páginas pares a extrair: ${evenPageIndices.map(idx => idx + 1).join(', ')}`);

        if (evenPageIndices.length === 0) {
            console.log('⚠️ Nenhuma página par encontrada');
            return 0;
        }

        try {
            const newPdf = await PDFLib.PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdfDoc, evenPageIndices);
            
            console.log(`✅ ${copiedPages.length} páginas copiadas com sucesso`);
            
            copiedPages.forEach((page, index) => {
                newPdf.addPage(page);
                console.log(`📄 Página ${evenPageIndices[index] + 1} adicionada ao novo PDF`);
            });

            const pdfBytes = await newPdf.save();
            const baseName = originalName.replace(/\.pdf$/i, '');
            const fileName = `${baseName}_páginas_pares.pdf`;

            this.downloadPDF(pdfBytes, fileName);
            
            const message = `Páginas pares extraídas: ${fileName} (${evenPageIndices.length} páginas: ${evenPageIndices.map(idx => idx + 1).join(', ')})`;
            UI.addLog(message);
            console.log(`✅ ${message}`);

            return evenPageIndices.length;
        } catch (error) {
            console.error(`❌ Erro ao extrair páginas pares de ${originalName}:`, error);
            throw error;
        }
    }

    async extractCustomPages(pdfDoc, originalName, totalPages) {
        console.log(`🎯 Extraindo páginas customizadas de ${originalName} (${totalPages} páginas total)`);
        
        const rangesInput = document.getElementById('extract-ranges')?.value || '';

        if (!rangesInput.trim()) {
            console.log('⚠️ Nenhuma página especificada para extração customizada');
            UI.showToast('Por favor, especifique as páginas a serem extraídas', 'warning');
            return 0;
        }

        console.log(`📝 Entrada de páginas: "${rangesInput}"`);

        const baseName = originalName.replace(/\.pdf$/i, '');
        const ranges = this.parsePageRanges(rangesInput, totalPages);

        if (ranges.length === 0) {
            console.log('❌ Páginas especificadas inválidas');
            UI.showToast('Páginas especificadas inválidas', 'error');
            return 0;
        }

        console.log(`📊 Intervalos parseados:`, ranges);

        // Coletar todos os índices de páginas únicos
        const allPageIndices = new Set();
        ranges.forEach(range => {
            for (let page = range.start; page <= range.end; page++) {
                if (page >= 1 && page <= totalPages) {
                    allPageIndices.add(page - 1); // Converter para índice baseado em 0
                }
            }
        });

        const pageIndicesArray = Array.from(allPageIndices).sort((a, b) => a - b);

        console.log(`📄 Páginas a extrair (índices):`, pageIndicesArray);
        console.log(`📊 Páginas a extrair (números): ${pageIndicesArray.map(idx => idx + 1).join(', ')}`);

        if (pageIndicesArray.length === 0) {
            console.log('⚠️ Nenhuma página válida encontrada para extração');
            return 0;
        }

        try {
            const newPdf = await PDFLib.PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdfDoc, pageIndicesArray);
            
            console.log(`✅ ${copiedPages.length} páginas copiadas com sucesso`);
            
            copiedPages.forEach((page, index) => {
                newPdf.addPage(page);
                console.log(`📄 Página ${pageIndicesArray[index] + 1} adicionada ao novo PDF`);
            });

            const pdfBytes = await newPdf.save();
            const fileName = `${baseName}_páginas_extraídas.pdf`;

            this.downloadPDF(pdfBytes, fileName);
            
            const message = `Páginas customizadas extraídas: ${fileName} (${pageIndicesArray.length} páginas: ${pageIndicesArray.map(idx => idx + 1).join(', ')})`;
            UI.addLog(message);
            console.log(`✅ ${message}`);

            return pageIndicesArray.length;
        } catch (error) {
            console.error(`❌ Erro ao extrair páginas customizadas de ${originalName}:`, error);
            throw error;
        }
    }

    parsePageRanges(rangesInput, totalPages) {
        console.log(`🔍 Parseando ranges: "${rangesInput}" para PDF com ${totalPages} páginas`);
        
        const ranges = [];
        const parts = rangesInput.split(',');

        for (const part of parts) {
            const trimmed = part.trim();
            
            if (!trimmed) continue; // Ignorar partes vazias

            console.log(`🔸 Processando parte: "${trimmed}"`);

            if (trimmed.includes('-')) {
                const dashParts = trimmed.split('-');
                if (dashParts.length === 2) {
                    const start = parseInt(dashParts[0].trim());
                    const end = parseInt(dashParts[1].trim());

                    if (start && end && start <= end && start >= 1 && end <= totalPages) {
                        ranges.push({ start, end });
                        console.log(`✅ Range válido: ${start}-${end}`);
                    } else {
                        console.log(`❌ Range inválido: ${start}-${end} (total: ${totalPages})`);
                    }
                } else {
                    console.log(`❌ Formato de range inválido: "${trimmed}"`);
                }
            } else {
                const page = parseInt(trimmed);
                if (page && page >= 1 && page <= totalPages) {
                    ranges.push({ start: page, end: page });
                    console.log(`✅ Página válida: ${page}`);
                } else {
                    console.log(`❌ Página inválida: ${page} (total: ${totalPages})`);
                }
            }
        }

        console.log(`📊 Ranges parseados:`, ranges);
        return ranges;
    }

    downloadPDF(pdfBytes, fileName) {
        try {
            // Sanitizar nome do arquivo
            const sanitizedFileName = this.sanitizeFileName(fileName);
            
            console.log(`💾 Fazendo download de: ${sanitizedFileName}`);
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = sanitizedFileName;
            
            // Adicionar ao DOM temporariamente
            document.body.appendChild(link);
            link.click();
            
            // Limpar
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            console.log(`✅ Download iniciado: ${sanitizedFileName}`);
        } catch (error) {
            console.error(`❌ Erro no download de ${fileName}:`, error);
            throw error;
        }
    }

    // Função para sanitizar nomes de arquivos
    sanitizeFileName(fileName) {
        // Remover ou substituir caracteres inválidos
        return fileName
            .replace(/[<>:"/\\|?*]/g, '_')  // Caracteres inválidos no Windows
            .replace(/\s+/g, ' ')          // Múltiplos espaços em um só
            .trim()                        // Remover espaços no início/fim
            .substring(0, 255);            // Limitar tamanho
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
                        // Páginas ímpares: 1, 3, 5, etc.
                        totalPages += Math.ceil(pageCount / 2);
                        break;
                    case 'even':
                        // Páginas pares: 2, 4, 6, etc.
                        totalPages += Math.floor(pageCount / 2);
                        break;
                    case 'custom':
                        const rangesInput = document.getElementById('extract-ranges')?.value || '';
                        if (rangesInput.trim()) {
                            const ranges = this.parsePageRanges(rangesInput, pageCount);
                            const uniquePages = new Set();
                            ranges.forEach(range => {
                                for (let page = range.start; page <= range.end; page++) {
                                    if (page >= 1 && page <= pageCount) {
                                        uniquePages.add(page);
                                    }
                                }
                            });
                            totalPages += uniquePages.size;
                        }
                        break;
                    default:
                        totalPages += pageCount > 0 ? 1 : 0;
                }
            } catch (error) {
                console.error(`Erro ao analisar ${file.name}:`, error);
            }
        }

        return totalPages;
    }
}

// Função de teste para validar extração de páginas ímpares e pares
function testPageExtractionLogic() {
    console.log('🧪 Testando lógica de extração de páginas...');
    
    // Simular diferentes cenários de PDFs
    const testCases = [
        { totalPages: 1, name: 'PDF com 1 página' },
        { totalPages: 2, name: 'PDF com 2 páginas' },
        { totalPages: 5, name: 'PDF com 5 páginas' },
        { totalPages: 10, name: 'PDF com 10 páginas' }
    ];
    
    testCases.forEach(testCase => {
        console.log(`\n📄 ${testCase.name} (${testCase.totalPages} páginas):`);
        
        // Testar páginas ímpares
        const oddIndices = [];
        for (let i = 0; i < testCase.totalPages; i += 2) {
            oddIndices.push(i);
        }
        const oddPages = oddIndices.map(idx => idx + 1);
        console.log(`  🔸 Páginas ímpares: ${oddPages.join(', ')} (${oddPages.length} páginas)`);
        
        // Testar páginas pares
        const evenIndices = [];
        for (let i = 1; i < testCase.totalPages; i += 2) {
            evenIndices.push(i);
        }
        const evenPages = evenIndices.map(idx => idx + 1);
        console.log(`  🔹 Páginas pares: ${evenPages.join(', ')} (${evenPages.length} páginas)`);
        
        // Verificar se todas as páginas estão cobertas
        const allPages = [...oddPages, ...evenPages].sort((a, b) => a - b);
        const expectedPages = Array.from({length: testCase.totalPages}, (_, i) => i + 1);
        const isComplete = JSON.stringify(allPages) === JSON.stringify(expectedPages);
        console.log(`  ✅ Todas as páginas cobertas: ${isComplete ? 'SIM' : 'NÃO'}`);
    });
    
    console.log('\n🧪 Teste de lógica concluído!');
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

// Executar teste se estiver em modo debug
if (window.location.search.includes('debug=true')) {
    testPageExtractionLogic();
}
