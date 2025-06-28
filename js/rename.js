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
    } extractItauData(text, pageNum) {
        console.log('🏦 Extraindo dados do Itaú da página', pageNum);

        const result = {
            pageNumber: pageNum,
            recipient: 'Destinatário não encontrado',
            value: '0,00',
            type: 'Desconhecido',
            rawText: text.substring(0, 200) + '...',
            success: false
        };

        try {
            // Detectar tipo de comprovante
            const documentType = this.detectItauDocumentType(text);
            result.type = documentType;

            console.log(`📄 Tipo de documento detectado: ${documentType}`);

            // Extrair dados baseado no tipo
            switch (documentType) {
                case 'PIX':
                    this.extractPixData(text, result);
                    break;
                case 'Boleto':
                    this.extractBoletoData(text, result);
                    break;
                case 'TED':
                    this.extractTedData(text, result);
                    break;
                default:
                    console.warn(`⚠️ Tipo de documento não reconhecido para página ${pageNum}`);
                    break;
            }

            console.log(`📊 Dados extraídos da página ${pageNum}:`, result);

        } catch (error) {
            console.error(`❌ Erro ao extrair dados da página ${pageNum}:`, error);
        }

        return result;
    }

    detectItauDocumentType(text) {
        // Normalizar texto para facilitar detecção
        const normalizedText = text.toUpperCase().replace(/\s+/g, ' ');

        // Detectar PIX - deve ser verificado primeiro pois pode ter overlap com outros
        if (normalizedText.includes('PIX TRANSFERENCIA') ||
            normalizedText.includes('COMPROVANTE DE TRANSFERENCIA') ||
            normalizedText.includes('NOME DO RECEBEDOR:')) {
            return 'PIX';
        }

        // Detectar TED - verificar antes de Boleto pois TED pode ter "pagamento"
        if (normalizedText.includes('COMPROVANTE DE PAGAMENTO') &&
            (normalizedText.includes('TED C') || normalizedText.includes('TED'))) {
            return 'TED';
        }

        if (normalizedText.includes('NOME DO FAVORECIDO:') ||
            normalizedText.includes('VALOR DA TED:')) {
            return 'TED';
        }

        // Detectar Boleto
        if (normalizedText.includes('BENEFICIARIO:') ||
            normalizedText.includes('VALOR DO BOLETO') ||
            normalizedText.includes('VALOR DO PAGAMENTO') ||
            (normalizedText.includes('DADOS DO PAGAMENTO') && normalizedText.includes('BOLETO'))) {
            return 'Boleto';
        }

        return 'Desconhecido';
    }

    extractPixData(text, result) {
        console.log('📱 Extraindo dados de PIX');

        // Padrões específicos para PIX
        const patterns = {
            // Nome do recebedor (aparece após "nome do recebedor:")
            recipient: /nome do recebedor:\s*([A-ZÁÊÇÕÜÚ\s]+)/i,
            // Valor da transação
            value: /valor:\s*R\$\s*([\d.,]+)/i,
            // Valor alternativo
            valueAlt: /R\$\s*([\d.,]+)/g
        };

        // Extrair destinatário
        const recipientMatch = text.match(patterns.recipient);
        if (recipientMatch) {
            result.recipient = this.formatName(recipientMatch[1].trim());
            result.success = true;
        }

        // Extrair valor
        let valueMatch = text.match(patterns.value);
        if (valueMatch) {
            result.value = this.formatValue(valueMatch[1]);
        } else {
            // Tentar padrão alternativo
            const valueMatches = [...text.matchAll(patterns.valueAlt)];
            if (valueMatches.length > 0) {
                // Pegar o maior valor (provavelmente o valor da transferência)
                const values = valueMatches.map(match => this.parseValue(match[1]));
                const maxValue = Math.max(...values);
                result.value = this.formatValue(maxValue.toString());
            }
        }
    } extractBoletoData(text, result) {
        console.log('🧾 Extraindo dados de Boleto');

        // Debug: mostrar o texto que está sendo analisado
        console.log('📝 Texto do boleto:', text.substring(0, 500));

        // Padrões específicos para Boleto
        const patterns = {
            // Beneficiário - captura até encontrar CPF/CNPJ ou nova linha
            recipient: /Benefici[aá]rio:\s*([A-Z][A-Z\s&.-]+?)(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i,
            // Valor do pagamento - padrão mais específico para o formato "(R$):"
            valuePayment: /Valor do pagamento\s*\(R\$\):\s*([\d.,]+)/i,
            // Valor do boleto - padrão mais específico
            valueBoleto: /Valor do boleto\s*\(R\$\):\s*([\d.,]+)/i,
            // Padrão alternativo sem parênteses
            valuePaymentAlt: /Valor do pagamento[^:]*:\s*R?\$?\s*([\d.,]+)/i,
            // Padrão mais genérico para qualquer valor em R$
            valueGeneral: /(?:=|:)\s*(?:R\$)?\s*([\d]+\.?[\d]*,[\d]{2})/g,
            // Padrão para capturar valores numéricos isolados que parecem monetários
            valueNumeric: /([\d]{1,3}(?:\.[\d]{3})*,[\d]{2})/g
        };

        // Extrair beneficiário
        const recipientMatch = text.match(patterns.recipient);
        if (recipientMatch) {
            let beneficiario = recipientMatch[1].trim();
            // Limpar texto extra que pode vir junto
            beneficiario = beneficiario.replace(/\s+/g, ' ').trim();
            result.recipient = this.formatName(beneficiario);
            result.success = true;
            console.log(`✅ Beneficiário extraído: ${result.recipient}`);
        } else {
            console.warn('⚠️ Beneficiário não encontrado no boleto');
        }

        // Extrair valor - tentar múltiplos padrões
        let valueMatch = null;
        let matchedPattern = '';

        // Tentar padrão específico do valor do pagamento
        valueMatch = text.match(patterns.valuePayment);
        if (valueMatch) {
            matchedPattern = 'valuePayment';
        }

        // Tentar padrão do valor do boleto
        if (!valueMatch) {
            valueMatch = text.match(patterns.valueBoleto);
            if (valueMatch) {
                matchedPattern = 'valueBoleto';
            }
        }

        // Tentar padrão alternativo
        if (!valueMatch) {
            valueMatch = text.match(patterns.valuePaymentAlt);
            if (valueMatch) {
                matchedPattern = 'valuePaymentAlt';
            }
        }

        // Tentar padrão genérico
        if (!valueMatch) {
            const generalMatches = [...text.matchAll(patterns.valueGeneral)];
            if (generalMatches.length > 0) {
                // Pegar o maior valor encontrado
                const values = generalMatches.map(match => this.parseValue(match[1]));
                const maxValue = Math.max(...values);
                if (maxValue > 0) {
                    valueMatch = [null, maxValue.toString().replace('.', ',')];
                    matchedPattern = 'valueGeneral';
                }
            }
        }

        // Como último recurso, procurar qualquer padrão numérico monetário
        if (!valueMatch) {
            const numericMatches = [...text.matchAll(patterns.valueNumeric)];
            if (numericMatches.length > 0) {
                // Filtrar valores que podem ser valores monetários (> 1,00)
                const monetaryValues = numericMatches
                    .map(match => ({ value: this.parseValue(match[1]), original: match[1] }))
                    .filter(item => item.value >= 1.00);

                if (monetaryValues.length > 0) {
                    // Pegar o maior valor
                    const maxItem = monetaryValues.reduce((max, item) =>
                        item.value > max.value ? item : max
                    );
                    valueMatch = [null, maxItem.original];
                    matchedPattern = 'valueNumeric';
                }
            }
        }

        if (valueMatch && valueMatch[1]) {
            result.value = this.formatValue(valueMatch[1]);
            console.log(`✅ Valor extraído: R$ ${result.value} (padrão: ${matchedPattern})`);
        } else {
            console.warn('⚠️ Valor não encontrado no boleto');
            console.log('🔍 Tentando encontrar qualquer valor no texto...');

            // Debug: mostrar todos os números encontrados
            const allNumbers = text.match(/[\d.,]+/g);
            if (allNumbers) {
                console.log('🔢 Números encontrados:', allNumbers);
            }
        }
    } extractTedData(text, result) {
        console.log('🏛️ Extraindo dados de TED');

        // Debug: mostrar o texto que está sendo analisado
        console.log('📝 Texto do TED:', text.substring(0, 500));

        // Padrões específicos para TED
        const patterns = {
            // Nome do favorecido - padrão mais abrangente
            recipient: /Nome do favorecido:\s*([A-ZÁÊÇÕÜÚ][A-ZÁÊÇÕÜÚ\s&.\-\/]+?)(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i,
            // Padrão alternativo para capturar nomes com caracteres especiais
            recipientAlt: /Nome do favorecido:\s*([A-Z][A-Z\s\-&.\/]+)/i,
            // Padrão mais genérico
            recipientGeneral: /favorecido:\s*([A-ZÁÊÇÕÜÚ][^0-9\r\n]+?)(?:\s+(?:CPF|CNPJ)|[\r\n]|Número|Agência|$)/i,
            // Valor da TED - padrão mais robusto
            value: /Valor da TED:\s*R\$\s*([\d.,]+)/i,
            // Valor alternativo
            valueAlt: /TED:\s*R\$\s*([\d.,]+)/i
        };

        // Extrair favorecido - tentar múltiplos padrões
        let recipientMatch = null;
        let matchedPattern = '';

        // Tentar padrão principal
        recipientMatch = text.match(patterns.recipient);
        if (recipientMatch) {
            matchedPattern = 'recipient';
        }

        // Tentar padrão alternativo
        if (!recipientMatch) {
            recipientMatch = text.match(patterns.recipientAlt);
            if (recipientMatch) {
                matchedPattern = 'recipientAlt';
            }
        }

        // Tentar padrão genérico
        if (!recipientMatch) {
            recipientMatch = text.match(patterns.recipientGeneral);
            if (recipientMatch) {
                matchedPattern = 'recipientGeneral';
            }
        }

        if (recipientMatch) {
            let favorecido = recipientMatch[1].trim();
            // Limpar texto extra que pode vir junto
            favorecido = favorecido.replace(/\s+/g, ' ').trim();
            // Remover possíveis sufixos indesejados
            favorecido = favorecido.replace(/\s+(CPF|CNPJ).*$/i, '');

            result.recipient = this.formatName(favorecido);
            result.success = true;
            console.log(`✅ Favorecido extraído: ${result.recipient} (padrão: ${matchedPattern})`);
        } else {
            console.warn('⚠️ Favorecido não encontrado no TED');

            // Debug: tentar encontrar qualquer ocorrência de "favorecido"
            const debugMatch = text.match(/favorecido[^a-z]*([A-Z][^0-9\r\n]+)/i);
            if (debugMatch) {
                console.log('🔍 Possível favorecido encontrado:', debugMatch[1]);
            }
        }

        // Extrair valor
        let valueMatch = text.match(patterns.value);
        if (!valueMatch) {
            valueMatch = text.match(patterns.valueAlt);
        }

        if (valueMatch) {
            result.value = this.formatValue(valueMatch[1]);
            console.log(`✅ Valor extraído: R$ ${result.value}`);
        } else {
            console.warn('⚠️ Valor não encontrado no TED');
        }
    }

    parseValue(valueStr) {
        if (!valueStr) return 0;

        // Remover espaços e caracteres especiais
        let cleanValue = valueStr.toString().trim();

        // Se já está no formato brasileiro (ex: 27.296,82)
        if (cleanValue.includes(',') && cleanValue.lastIndexOf(',') > cleanValue.lastIndexOf('.')) {
            // Remover pontos (separadores de milhares) e trocar vírgula por ponto
            cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        }
        // Se está no formato americano (ex: 27,296.82)
        else if (cleanValue.includes('.') && cleanValue.lastIndexOf('.') > cleanValue.lastIndexOf(',')) {
            // Remover vírgulas (separadores de milhares)
            cleanValue = cleanValue.replace(/,/g, '');
        }
        // Se tem apenas vírgula (ex: 123,45)
        else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
            cleanValue = cleanValue.replace(',', '.');
        }

        const result = parseFloat(cleanValue) || 0;
        console.log(`🔢 parseValue: "${valueStr}" -> "${cleanValue}" -> ${result}`);
        return result;
    }

    formatValue(valueStr) {
        // Formatar valor para o padrão brasileiro
        const numValue = typeof valueStr === 'string' ? this.parseValue(valueStr) : valueStr;
        if (isNaN(numValue) || numValue <= 0) {
            return '0,00';
        }
        return numValue.toFixed(2).replace('.', ',');
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
        if (!name) return 'Nome não encontrado';

        // Limpar espaços extras e caracteres indesejados
        let cleanName = name.trim().replace(/\s+/g, ' ');

        // Remover possíveis restos de texto que podem ter vindo junto
        cleanName = cleanName.replace(/\s+(CPF|CNPJ).*$/i, '');
        cleanName = cleanName.replace(/^\s*[-:]\s*/, ''); // Remove hífen ou dois pontos no início

        // Se o nome está todo em maiúscula (como nomes de empresas), formatar adequadamente
        if (cleanName === cleanName.toUpperCase()) {
            // Para empresas, converter para título mas manter algumas palavras específicas em maiúscula
            const wordsToKeepUpper = ['LTDA', 'SA', 'ME', 'EPP', 'EIRELI', 'DO', 'DA', 'DE', 'E', 'COM', 'LTDA.', 'S.A.'];
            const wordsToKeepLower = ['de', 'da', 'do', 'e', 'com'];

            return cleanName.toLowerCase().replace(/\b[\w\-]+/g, (word) => {
                const upperWord = word.toUpperCase();
                const lowerWord = word.toLowerCase();

                // Manter palavras específicas em maiúscula
                if (wordsToKeepUpper.includes(upperWord)) {
                    return upperWord;
                }

                // Manter algumas preposições em minúscula (exceto se for a primeira palavra)
                if (wordsToKeepLower.includes(lowerWord) && cleanName.toLowerCase().indexOf(lowerWord) > 0) {
                    return lowerWord;
                }

                // Para palavras com hífen, capitalizar cada parte
                if (word.includes('-')) {
                    return word.split('-').map(part =>
                        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                    ).join('-');
                }

                // Capitalizar normalmente
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            });
        }

        // Para nomes normais (já em formato misto), apenas limpar
        return cleanName.replace(/\b\w/g, l => l.toUpperCase());
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

            // Ícone baseado no tipo de documento
            const typeIcon = this.getTypeIcon(data.type);
            const typeColor = this.getTypeColor(data.type);

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
        });

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
