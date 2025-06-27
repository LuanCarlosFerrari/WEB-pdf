// PDF Renaming Module
class PDFRenamer {
    constructor() {
        console.log('🔧 Inicializando PDFRenamer...');
        this.rules = [];
        this.extractionRules = [];
        this.initializeRenameFeatures();
        console.log('✅ PDFRenamer inicializado com sucesso!');
    }

    initializeRenameFeatures() {
        this.setupEventListeners();
        this.loadRenameRules();
        this.loadExtractionRules();
    }

    setupEventListeners() {
        const addRuleBtn = document.getElementById('add-rename-rule');
        const clearRulesBtn = document.getElementById('clear-rename-rules');
        const processFilesBtn = document.getElementById('process-rename-files');
        const addExtractionBtn = document.getElementById('add-extraction-rule');
        const clearExtractionBtn = document.getElementById('clear-extraction-rules');
        const addExampleExtractionsBtn = document.getElementById('add-example-extractions');
        const testContentExtractionBtn = document.getElementById('test-content-extraction');
        const renameModeRadios = document.querySelectorAll('input[name="rename-mode"]');
        const extractionFieldSelect = document.getElementById('extraction-field');

        console.log('🔗 Configurando event listeners do renomeador:', {
            addRuleBtn: !!addRuleBtn,
            clearRulesBtn: !!clearRulesBtn,
            processFilesBtn: !!processFilesBtn,
            addExtractionBtn: !!addExtractionBtn,
            clearExtractionBtn: !!clearExtractionBtn,
            addExampleExtractionsBtn: !!addExampleExtractionsBtn,
            testContentExtractionBtn: !!testContentExtractionBtn,
            renameModeRadios: renameModeRadios.length,
            extractionFieldSelect: !!extractionFieldSelect
        });

        if (addRuleBtn) {
            addRuleBtn.addEventListener('click', () => {
                console.log('🔄 Botão adicionar regra clicado');
                this.addRenameRule();
            });
        } else {
            console.error('❌ Botão add-rename-rule não encontrado');
        }

        if (clearRulesBtn) {
            clearRulesBtn.addEventListener('click', () => {
                console.log('🗑️ Botão limpar regras clicado');
                this.clearRenameRules();
            });
        } else {
            console.error('❌ Botão clear-rename-rules não encontrado');
        }

        if (addExtractionBtn) {
            addExtractionBtn.addEventListener('click', () => {
                console.log('🔄 Botão adicionar extração clicado');
                this.addExtractionRule();
            });
        }

        if (clearExtractionBtn) {
            clearExtractionBtn.addEventListener('click', () => {
                console.log('🗑️ Botão limpar extrações clicado');
                this.clearExtractionRules();
            });
        }

        if (addExampleExtractionsBtn) {
            addExampleExtractionsBtn.addEventListener('click', () => {
                console.log('🎯 Botão adicionar exemplos de extração clicado');
                this.addExampleExtractions();
            });
        }

        if (testContentExtractionBtn) {
            testContentExtractionBtn.addEventListener('click', () => {
                console.log('🧪 Botão testar extração clicado');
                this.testContentExtraction();
            });
        }

        if (processFilesBtn) {
            processFilesBtn.addEventListener('click', () => {
                console.log('▶️ Botão processar arquivos clicado');
                this.processRenameFiles();
            });
        } else {
            console.error('❌ Botão process-rename-files não encontrado');
        }

        // Event listeners para mudança de modo
        renameModeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                console.log('🔄 Modo de renomeação alterado:', radio.value);
                this.toggleRenameModeUI(radio.value);
            });
        });

        // Event listener para campo de extração personalizado
        if (extractionFieldSelect) {
            extractionFieldSelect.addEventListener('change', () => {
                this.toggleCustomPattern(extractionFieldSelect.value === 'custom');
            });
        }
    }

    addRenameRule() {
        const find = document.getElementById('rename-find')?.value || '';
        const replace = document.getElementById('rename-replace')?.value || '';

        console.log('📝 Adicionando regra:', { find, replace });

        if (!find.trim()) {
            console.warn('⚠️ Texto de busca vazio');
            UI.showToast('Por favor, digite o texto a ser encontrado', 'warning');
            return;
        }

        const rule = {
            find: find,
            replace: replace,
            id: Date.now()
        };

        this.rules.push(rule);
        console.log('✅ Regra adicionada:', rule);
        console.log('📊 Total de regras:', this.rules.length);
        
        this.updateRulesDisplay();
        this.saveRenameRules(); // Salvar automaticamente
        this.clearRuleInputs();
        UI.showToast('Regra adicionada com sucesso', 'success');
    }

    clearRenameRules() {
        this.rules = [];
        this.updateRulesDisplay();
        UI.showToast('Todas as regras foram removidas', 'info');
    }

    updateRulesDisplay() {
        const container = document.getElementById('rename-rules-list');
        if (!container) {
            console.error('❌ Container rename-rules-list não encontrado');
            return;
        }

        console.log('🔄 Atualizando exibição das regras:', this.rules.length);

        if (this.rules.length === 0) {
            container.innerHTML = '<p class="no-rules">Nenhuma regra adicionada</p>';
            return;
        }

        container.innerHTML = this.rules.map(rule => `
            <div class="rule-item" data-id="${rule.id}">
                <div class="rule-content">
                    <span class="rule-find">"${rule.find}"</span>
                    <span class="rule-arrow">→</span>
                    <span class="rule-replace">"${rule.replace || '(vazio)'}"</span>
                </div>
                <button class="btn-base btn-danger btn-sm" onclick="window.pdfRenamer.removeRule(${rule.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        console.log('✅ Exibição das regras atualizada');
    }

    removeRule(ruleId) {
        console.log('🗑️ Removendo regra:', ruleId);
        const beforeCount = this.rules.length;
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
        const afterCount = this.rules.length;
        
        console.log(`📊 Regras: ${beforeCount} → ${afterCount}`);
        
        this.updateRulesDisplay();
        this.saveRenameRules(); // Salvar automaticamente
        UI.showToast('Regra removida', 'info');
    }

    // ============ MÉTODOS DE EXTRAÇÃO DE DADOS ============

    toggleRenameModeUI(mode) {
        const textReplaceSection = document.getElementById('text-replace-section');
        const contentExtractionSection = document.getElementById('content-extraction-section');

        console.log('🔄 Alternando UI para modo:', mode);

        if (mode === 'text-replace') {
            if (textReplaceSection) textReplaceSection.style.display = 'block';
            if (contentExtractionSection) contentExtractionSection.style.display = 'none';
        } else if (mode === 'content-extraction') {
            if (textReplaceSection) textReplaceSection.style.display = 'none';
            if (contentExtractionSection) contentExtractionSection.style.display = 'block';
        }
    }

    toggleCustomPattern(show) {
        const customPatternDiv = document.getElementById('custom-pattern-div');
        if (customPatternDiv) {
            customPatternDiv.style.display = show ? 'block' : 'none';
        }
    }

    addExtractionRule() {
        const field = document.getElementById('extraction-field')?.value || '';
        const position = document.getElementById('extraction-position')?.value || 'prefix';
        const customPattern = document.getElementById('custom-pattern')?.value || '';

        console.log('📝 Adicionando regra de extração:', { field, position, customPattern });

        if (!field) {
            console.warn('⚠️ Campo de extração não selecionado');
            UI.showToast('Por favor, selecione um campo para extrair', 'warning');
            return;
        }

        if (field === 'custom' && !customPattern.trim()) {
            console.warn('⚠️ Padrão personalizado não definido');
            UI.showToast('Por favor, defina um padrão regex personalizado', 'warning');
            return;
        }

        const rule = {
            field: field,
            position: position,
            customPattern: field === 'custom' ? customPattern : null,
            pattern: this.getExtractionPattern(field, customPattern),
            id: Date.now()
        };

        this.extractionRules.push(rule);
        console.log('✅ Regra de extração adicionada:', rule);
        console.log('📊 Total de regras de extração:', this.extractionRules.length);
        
        this.updateExtractionRulesDisplay();
        this.saveExtractionRules();
        this.clearExtractionInputs();
        UI.showToast('Regra de extração adicionada com sucesso', 'success');
    }

    clearExtractionRules() {
        this.extractionRules = [];
        this.updateExtractionRulesDisplay();
        this.saveExtractionRules();
        UI.showToast('Todas as regras de extração foram removidas', 'info');
    }

    getExtractionPattern(field, customPattern) {
        const patterns = {
            'remetente': {
                regex: /(?:remetente|de|from)[:\s]*([A-Za-z\s]+)/i,
                description: 'Extrai nome do remetente'
            },
            'valor': {
                regex: /(?:valor|quantia|R\$)[:\s]*R?\$?\s*(\d+[,.]?\d*)/i,
                description: 'Extrai valor monetário'
            },
            'data': {
                regex: /(\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/,
                description: 'Extrai data no formato DD/MM/AAAA ou DD-MM-AAAA'
            },
            'numero': {
                regex: /(?:n[úu]mero|doc|documento)[:\s]*(\d+)/i,
                description: 'Extrai número do documento'
            },
            'custom': {
                regex: customPattern ? new RegExp(customPattern, 'i') : null,
                description: 'Padrão personalizado'
            }
        };

        return patterns[field] || patterns['custom'];
    }

    updateExtractionRulesDisplay() {
        const container = document.getElementById('extraction-rules-list');
        if (!container) {
            console.error('❌ Container extraction-rules-list não encontrado');
            return;
        }

        console.log('🔄 Atualizando exibição das regras de extração:', this.extractionRules.length);

        if (this.extractionRules.length === 0) {
            container.innerHTML = '<p class="no-rules">Nenhuma regra de extração adicionada</p>';
            return;
        }

        container.innerHTML = this.extractionRules.map(rule => `
            <div class="rule-item" data-id="${rule.id}">
                <div class="rule-content">
                    <span class="rule-field"><strong>${this.getFieldDisplayName(rule.field)}</strong></span>
                    <span class="rule-arrow">→</span>
                    <span class="rule-position">${this.getPositionDisplayName(rule.position)}</span>
                </div>
                <button class="btn-base btn-danger btn-sm" onclick="window.pdfRenamer.removeExtractionRule(${rule.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        console.log('✅ Exibição das regras de extração atualizada');
    }

    removeExtractionRule(ruleId) {
        console.log('🗑️ Removendo regra de extração:', ruleId);
        const beforeCount = this.extractionRules.length;
        this.extractionRules = this.extractionRules.filter(rule => rule.id !== ruleId);
        const afterCount = this.extractionRules.length;
        
        console.log(`📊 Regras de extração: ${beforeCount} → ${afterCount}`);
        
        this.updateExtractionRulesDisplay();
        this.saveExtractionRules();
        UI.showToast('Regra de extração removida', 'info');
    }

    getFieldDisplayName(field) {
        const names = {
            'remetente': 'Remetente',
            'valor': 'Valor',
            'data': 'Data',
            'numero': 'Número',
            'custom': 'Personalizado'
        };
        return names[field] || field;
    }

    getPositionDisplayName(position) {
        const names = {
            'prefix': 'Prefixo',
            'suffix': 'Sufixo',
            'replace': 'Substituir'
        };
        return names[position] || position;
    }

    clearExtractionInputs() {
        const fieldSelect = document.getElementById('extraction-field');
        const positionSelect = document.getElementById('extraction-position');
        const customPattern = document.getElementById('custom-pattern');

        if (fieldSelect) fieldSelect.value = 'remetente';
        if (positionSelect) positionSelect.value = 'prefix';
        if (customPattern) customPattern.value = '';
        
        this.toggleCustomPattern(false);
    }

    // ============ MÉTODOS DE EXTRAÇÃO DO CONTEÚDO DO PDF ============

    async extractDataFromPDF(file) {
        console.log('📖 Extraindo dados do PDF:', file.name);
        
        try {
            // Carregar PDF.js se não estiver disponível
            if (!window.pdfjsLib) {
                console.log('📚 Carregando PDF.js...');
                await this.loadPDFJS();
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            
            console.log(`📄 PDF carregado com ${pdf.numPages} páginas`);

            let fullText = '';
            
            // Extrair texto de todas as páginas (máximo 5 para performance)
            const maxPages = Math.min(pdf.numPages, 5);
            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + ' ';
                console.log(`📃 Página ${pageNum} extraída (${pageText.length} caracteres)`);
            }

            console.log(`📝 Texto total extraído: ${fullText.length} caracteres`);
            return fullText;

        } catch (error) {
            console.error('❌ Erro ao extrair dados do PDF:', error);
            throw error;
        }
    }

    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            if (window.pdfjsLib) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                console.log('✅ PDF.js carregado com sucesso');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Erro ao carregar PDF.js');
                reject(new Error('Falha ao carregar PDF.js'));
            };
            document.head.appendChild(script);
        });
    }

    extractDataUsingRules(text, rules) {
        const extractedData = {};
        
        console.log('🔍 Aplicando regras de extração ao texto...');
        
        rules.forEach((rule, index) => {
            try {
                const pattern = rule.pattern;
                if (pattern && pattern.regex) {
                    const match = text.match(pattern.regex);
                    if (match && match[1]) {
                        const cleanValue = match[1].trim();
                        extractedData[rule.field] = cleanValue;
                        console.log(`✅ Regra ${index + 1} (${rule.field}): "${cleanValue}"`);
                    } else {
                        console.log(`⚪ Regra ${index + 1} (${rule.field}): não encontrado`);
                    }
                }
            } catch (error) {
                console.error(`❌ Erro na regra ${index + 1}:`, error);
            }
        });

        console.log('📊 Dados extraídos:', extractedData);
        return extractedData;
    }

    generateNewFileName(originalName, extractedData, rules) {
        let newName = originalName;
        const baseName = originalName.replace(/\.pdf$/i, '');
        const extension = '.pdf';

        console.log('🏗️ Gerando novo nome:', { originalName, extractedData, rules: rules.length });

        rules.forEach((rule, index) => {
            const value = extractedData[rule.field];
            if (value) {
                const sanitizedValue = this.sanitizeFileName(value);
                
                switch (rule.position) {
                    case 'prefix':
                        newName = `${sanitizedValue}_${baseName}${extension}`;
                        console.log(`🏷️ Regra ${index + 1}: Prefixo aplicado`);
                        break;
                    case 'suffix':
                        newName = `${baseName}_${sanitizedValue}${extension}`;
                        console.log(`🏷️ Regra ${index + 1}: Sufixo aplicado`);
                        break;
                    case 'replace':
                        newName = `${sanitizedValue}${extension}`;
                        console.log(`🏷️ Regra ${index + 1}: Nome substituído`);
                        break;
                }
            } else {
                console.log(`⚪ Regra ${index + 1}: Valor não encontrado para ${rule.field}`);
            }
        });

        console.log(`🎯 Nome final: "${originalName}" → "${newName}"`);
        return newName;
    }

    // ============ MÉTODOS DE PERSISTÊNCIA ============

    loadExtractionRules() {
        const savedRules = localStorage.getItem('pdfProcessor_extractionRules');
        if (savedRules) {
            try {
                this.extractionRules = JSON.parse(savedRules);
                this.updateExtractionRulesDisplay();
                console.log('💾 Regras de extração carregadas:', this.extractionRules.length);
            } catch (error) {
                console.error('❌ Erro ao carregar regras de extração:', error);
            }
        }
    }

    saveExtractionRules() {
        localStorage.setItem('pdfProcessor_extractionRules', JSON.stringify(this.extractionRules));
        console.log('💾 Regras de extração salvas');
    }

    // ============ MÉTODO PRINCIPAL DE PROCESSAMENTO ============

    async processRenameFiles() {
        const files = CORE.getUploadedFiles();
        const renameModeRadios = document.querySelectorAll('input[name="rename-mode"]');
        const selectedMode = Array.from(renameModeRadios).find(radio => radio.checked)?.value || 'text-replace';

        console.log('🚀 Iniciando processo de renomeação...');
        console.log('📁 Arquivos carregados:', files.length);
        console.log('🔧 Modo selecionado:', selectedMode);

        if (files.length === 0) {
            console.warn('⚠️ Nenhum arquivo carregado');
            UI.showToast('Nenhum arquivo carregado', 'warning');
            return;
        }

        // Verificar regras baseadas no modo
        if (selectedMode === 'text-replace') {
            console.log('📝 Regras de substituição configuradas:', this.rules.length);
            if (this.rules.length === 0) {
                console.warn('⚠️ Nenhuma regra de substituição configurada');
                UI.showToast('Nenhuma regra de renomeação configurada', 'warning');
                return;
            }
        } else if (selectedMode === 'content-extraction') {
            console.log('🔍 Regras de extração configuradas:', this.extractionRules.length);
            if (this.extractionRules.length === 0) {
                console.warn('⚠️ Nenhuma regra de extração configurada');
                UI.showToast('Nenhuma regra de extração configurada', 'warning');
                return;
            }
        }

        UI.showProgress(0, 'Iniciando processo de renomeação...');

        try {
            let renamedCount = 0;
            let unchangedCount = 0;
            let errorCount = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progress = ((i + 1) / files.length) * 100;

                UI.showProgress(progress, `Processando ${file.name}...`);
                console.log(`📄 Processando arquivo ${i + 1}/${files.length}: ${file.name}`);

                try {
                    let newName = file.name;

                    if (selectedMode === 'text-replace') {
                        newName = await this.processTextReplacement(file);
                    } else if (selectedMode === 'content-extraction') {
                        newName = await this.processContentExtraction(file);
                    }

                    // Se o nome mudou, criar arquivo renomeado
                    if (newName !== file.name) {
                        try {
                            await this.downloadRenamedFile(file, newName);
                            UI.addLog(`✅ Arquivo renomeado: ${file.name} → ${newName}`);
                            console.log(`✅ Arquivo renomeado com sucesso: ${file.name} → ${newName}`);
                            renamedCount++;
                        } catch (downloadError) {
                            console.error(`❌ Erro ao fazer download de ${file.name}:`, downloadError);
                            UI.addLog(`❌ Erro ao renomear: ${file.name}`);
                            errorCount++;
                        }
                    } else {
                        UI.addLog(`⚪ Nenhuma alteração: ${file.name}`);
                        console.log(`⚪ Nenhuma alteração necessária: ${file.name}`);
                        unchangedCount++;
                    }

                } catch (processingError) {
                    console.error(`❌ Erro ao processar ${file.name}:`, processingError);
                    UI.addLog(`❌ Erro ao processar: ${file.name} - ${processingError.message}`);
                    errorCount++;
                }

                // Pequena pausa para não sobrecarregar
                await this.sleep(100);
            }

            UI.hideProgress();
            
            const message = `Processo concluído! ${renamedCount} arquivo(s) renomeado(s), ${unchangedCount} inalterado(s), ${errorCount} erro(s)`;
            UI.showToast(message, errorCount > 0 ? 'warning' : 'success');
            console.log(`🏁 ${message}`);

        } catch (error) {
            console.error('❌ Erro no processo de renomeação:', error);
            UI.hideProgress();
            UI.showToast('Erro durante o processo de renomeação', 'error');
        }
    }

    async processTextReplacement(file) {
        let newName = file.name;
        let originalName = file.name;

        console.log(`🔄 Aplicando substituição de texto para: ${originalName}`);

        this.rules.forEach((rule, ruleIndex) => {
            if (rule.find) {
                const beforeApply = newName;
                newName = newName.replace(new RegExp(this.escapeRegExp(rule.find), 'g'), rule.replace);
                if (beforeApply !== newName) {
                    console.log(`🔄 Regra ${ruleIndex + 1} aplicada: "${beforeApply}" → "${newName}"`);
                }
            }
        });

        return newName;
    }

    async processContentExtraction(file) {
        console.log(`🔍 Extraindo dados do conteúdo para: ${file.name}`);

        try {
            // Extrair texto do PDF
            const pdfText = await this.extractDataFromPDF(file);
            
            // Aplicar regras de extração
            const extractedData = this.extractDataUsingRules(pdfText, this.extractionRules);
            
            // Gerar novo nome baseado nos dados extraídos
            const newName = this.generateNewFileName(file.name, extractedData, this.extractionRules);
            
            return newName;

        } catch (error) {
            console.error(`❌ Erro na extração de dados para ${file.name}:`, error);
            UI.addLog(`⚠️ Erro na extração de dados para ${file.name}, mantendo nome original`);
            return file.name; // Retorna nome original em caso de erro
        }
    }

    // ============ MÉTODOS AUXILIARES ============

    async downloadRenamedFile(file, newName) {
        try {
            console.log(`💾 Fazendo download renomeado: ${file.name} → ${newName}`);
            
            // Sanitizar nome do arquivo
            const sanitizedName = this.sanitizeFileName(newName);
            console.log(`🧹 Nome sanitizado: ${sanitizedName}`);
            
            // Criar um novo arquivo com o nome alterado
            const blob = new Blob([file], { type: file.type });

            // Fazer download com o novo nome
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = sanitizedName;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpar URL object
            URL.revokeObjectURL(link.href);
            
            console.log(`✅ Download iniciado: ${sanitizedName}`);

        } catch (error) {
            console.error('❌ Erro ao renomear arquivo:', error);
            throw error;
        }
    }

    clearRuleInputs() {
        const findInput = document.getElementById('rename-find');
        const replaceInput = document.getElementById('rename-replace');

        if (findInput) findInput.value = '';
        if (replaceInput) replaceInput.value = '';
    }

    // Função para escapar caracteres especiais de regex
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    loadRenameRules() {
        // Carregar regras salvas do localStorage
        const savedRules = localStorage.getItem('pdfProcessor_renameRules');
        if (savedRules) {
            try {
                this.rules = JSON.parse(savedRules);
                this.updateRulesDisplay();
            } catch (error) {
                console.error('Erro ao carregar regras salvas:', error);
            }
        }
    }

    saveRenameRules() {
        // Salvar regras no localStorage
        localStorage.setItem('pdfProcessor_renameRules', JSON.stringify(this.rules));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Método para adicionar regras pré-definidas comuns
    addCommonRules() {
        const commonRules = [
            { find: ' ', replace: '_', id: Date.now() + 1 },
            { find: '(', replace: '', id: Date.now() + 2 },
            { find: ')', replace: '', id: Date.now() + 3 },
            { find: '[', replace: '', id: Date.now() + 4 },
            { find: ']', replace: '', id: Date.now() + 5 }
        ];

        this.rules.push(...commonRules);
        this.updateRulesDisplay();
        UI.showToast('Regras comuns adicionadas', 'success');
    }

    // Função de teste para validar regras de renomeação
    testRenameRules(testFileName = 'documento teste (1).pdf') {
        console.log('🧪 Testando regras de renomeação...');
        console.log(`📄 Arquivo de teste: "${testFileName}"`);
        console.log(`📝 Regras configuradas: ${this.rules.length}`);
        
        if (this.rules.length === 0) {
            console.log('⚠️ Nenhuma regra configurada para testar');
            return testFileName;
        }
        
        let resultName = testFileName;
        
        this.rules.forEach((rule, index) => {
            const beforeApply = resultName;
            if (rule.find) {
                resultName = resultName.replace(new RegExp(this.escapeRegExp(rule.find), 'g'), rule.replace);
                console.log(`🔄 Regra ${index + 1}: "${beforeApply}" → "${resultName}"`);
            }
        });
        
        console.log(`🎯 Resultado final: "${testFileName}" → "${resultName}"`);
        console.log('🧪 Teste concluído!');
        
        return resultName;
    }

    // Função para adicionar regras de exemplo
    addExampleRules() {
        const examples = [
            { find: ' ', replace: '_' },
            { find: '(', replace: '' },
            { find: ')', replace: '' },
            { find: 'teste', replace: 'exemplo' }
        ];
        
        examples.forEach(rule => {
            this.rules.push({
                ...rule,
                id: Date.now() + Math.random()
            });
        });
        
        this.updateRulesDisplay();
        this.saveRenameRules();
        UI.showToast('Regras de exemplo adicionadas', 'success');
        console.log('📝 Regras de exemplo adicionadas:', examples);
    }

    // Função para testar extração de dados
    testContentExtraction() {
        console.log('🧪 Testando extração de dados...');
        
        const sampleText = `
        Remetente: João Silva
        Valor: R$ 1.250,50
        Data: 15/03/2024
        Número do documento: 12345
        Descrição: Pagamento de serviços prestados
        `;
        
        console.log('📝 Texto de exemplo:', sampleText);
        
        if (this.extractionRules.length === 0) {
            console.log('⚠️ Nenhuma regra de extração configurada');
            UI.showToast('Configure algumas regras de extração primeiro', 'warning');
            return;
        }
        
        const extractedData = this.extractDataUsingRules(sampleText, this.extractionRules);
        const newName = this.generateNewFileName('documento_teste.pdf', extractedData, this.extractionRules);
        
        console.log('🎯 Resultado do teste de extração:', {
            extractedData,
            newName
        });

        // Mostrar resultado para o usuário
        UI.addLog(`🧪 TESTE DE EXTRAÇÃO:`);
        UI.addLog(`📝 Dados extraídos: ${JSON.stringify(extractedData)}`);
        UI.addLog(`🎯 Novo nome: documento_teste.pdf → ${newName}`);
        UI.showToast('Teste de extração executado - verifique o log', 'info');
        
        return { extractedData, newName };
    }

    // Função para adicionar regras de extração de exemplo
    addExampleExtractions() {
        console.log('📝 Adicionando regras de extração de exemplo...');
        
        const examples = [
            {
                field: 'remetente',
                position: 'prefix',
                pattern: this.getExtractionPattern('remetente')
            },
            {
                field: 'valor',
                position: 'suffix',
                pattern: this.getExtractionPattern('valor')
            }
        ];
        
        examples.forEach(example => {
            this.extractionRules.push({
                ...example,
                id: Date.now() + Math.random()
            });
        });
        
        this.updateExtractionRulesDisplay();
        this.saveExtractionRules();
        UI.showToast('Regras de extração de exemplo adicionadas', 'success');
        console.log('📝 Regras de extração de exemplo adicionadas:', examples);
    }
}

// Inicializar quando o DOM estiver pronto
// Salvar regras antes de sair da página
window.addEventListener('beforeunload', () => {
    if (window.pdfRenamer) {
        window.pdfRenamer.saveRenameRules();
    }
});
