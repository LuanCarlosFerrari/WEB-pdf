// Template de Extração de Dados - Banco Bradesco
// Suporta: Transferência e Boleto

class BradescoTemplate {
    constructor() {
        this.bankName = 'Bradesco';
        this.supportedTypes = ['Transferência', 'Boleto'];
        console.log('🏦 Template Bradesco inicializado');
    }

    // Método principal para extrair dados do texto
    extractData(text, pageNum) {
        console.group(`🏦 Extraindo dados do Bradesco da página ${pageNum}`);

        const result = {
            pageNumber: pageNum,
            recipient: 'Destinatário não encontrado',
            value: '0,00',
            type: 'Desconhecido',
            rawText: text.substring(0, 200) + '...',
            success: false,
            bank: this.bankName
        };

        try {
            // Debug: mostrar preview do texto
            console.log('📄 Preview do texto:', text.substring(0, 500));

            // Detectar tipo de comprovante
            const documentType = this.detectDocumentType(text);
            result.type = documentType;

            console.log(`📄 Tipo de documento detectado: ${documentType}`);

            if (documentType === 'Desconhecido') {
                console.warn(`⚠️ Tipo de documento não reconhecido para página ${pageNum}`);
                console.groupEnd();
                return result;
            }

            // Extrair dados baseado no tipo
            switch (documentType) {
                case 'Transferência':
                    this.extractTransferenciaData(text, result);
                    break;
                case 'Boleto':
                    this.extractBoletoData(text, result);
                    break;
                default:
                    console.warn(`⚠️ Tipo de documento não suportado: ${documentType}`);
                    break;
            }

            // Validar se conseguiu extrair dados essenciais
            if (result.recipient && result.recipient !== 'Destinatário não encontrado') {
                result.success = true;
                console.log(`✅ Extração bem-sucedida da página ${pageNum}`);
            } else {
                console.warn(`⚠️ Não foi possível extrair dados válidos da página ${pageNum}`);

                // Fazer análise completa para debug
                this.analyzeTextForDebug(text);
            }

            console.log(`📊 Resultado final:`, {
                tipo: result.type,
                destinatario: result.recipient,
                valor: result.value,
                sucesso: result.success
            });

        } catch (error) {
            console.error(`❌ Erro ao extrair dados da página ${pageNum}:`, error);
            result.recipient = `Erro na página ${pageNum}`;
        }

        console.groupEnd();
        return result;
    }

    // Detectar tipo de documento Bradesco
    detectDocumentType(text) {
        const normalizedText = text.toUpperCase().replace(/\s+/g, ' ');
        console.log('🔍 Detectando tipo de documento...');
        console.log('📄 Texto normalizado (primeiros 300 chars):', normalizedText.substring(0, 300));

        // Padrões específicos para transferência do Bradesco
        const transferenciaPatterns = [
            'COMPROVANTE DE TRANSACAO BANCARIA',
            'COMPROVANTE DE TRANSAÇÃO BANCARIA',
            'TRANSACAO BANCARIA',
            'TRANSAÇÃO BANCARIA',
            'TRANSFERENCIA',
            'TRANSFERÊNCIA',
            'RAZAO SOCIAL BENEFICIARIO',
            'RAZÃO SOCIAL BENEFICIÁRIO',
            'NOME FANTASIA BENEFICIARIO',
            'BENEFICIARIO',
            'BENEFICIÁRIO',
            'BANCO DESTINATARIO',
            'BANCO DESTINATÁRIO',
            'CONTA DESTINATARIA',
            'CONTA DESTINATÁRIA',
            'INSTITUICAO RECEBEDORA',
            'INSTITUIÇÃO RECEBEDORA'
        ];

        // Padrões específicos para boleto do Bradesco
        const boletoPatterns = [
            'BOLETO DE COBRANCA',
            'BOLETO DE COBRANÇA',
            'PAGAMENTO DE BOLETO',
            'CEDENTE',
            'SACADO',
            'NOSSO NUMERO',
            'NOSSO NÚMERO',
            'LINHA DIGITAVEL',
            'LINHA DIGITÁVEL',
            'CODIGO DE BARRAS',
            'CÓDIGO DE BARRAS'
        ];

        // Verificar transferência
        for (const pattern of transferenciaPatterns) {
            if (normalizedText.includes(pattern)) {
                console.log(`✅ Documento identificado como: Transferência (padrão: ${pattern})`);
                return 'Transferência';
            }
        }

        // Verificar boleto
        for (const pattern of boletoPatterns) {
            if (normalizedText.includes(pattern)) {
                console.log(`✅ Documento identificado como: Boleto (padrão: ${pattern})`);
                return 'Boleto';
            }
        }

        // Fallback: se tem palavras-chave genéricas, assumir transferência
        if (normalizedText.includes('BRADESCO') &&
            (normalizedText.includes('VALOR') || normalizedText.includes('R$'))) {
            console.log('⚠️ Documento identificado como: Transferência (fallback)');
            return 'Transferência';
        }

        console.log('❌ Tipo de documento não identificado');
        return 'Desconhecido';
    }

    // Extrair dados de transferência Bradesco
    extractTransferenciaData(text, result) {
        console.log('💸 Extraindo dados de transferência Bradesco');
        console.log('📄 Texto completo para análise:', text.substring(0, 1000));

        // Padrões mais flexíveis e específicos para Bradesco
        const patterns = {
            // Padrões com base na imagem real do Bradesco
            razaoSocial: [
                /Razão\s+Social\s+(?:do\s+)?Beneficiário[:\s]*([A-ZÁÊÇÕÜÚ][^\n\r]{5,60})(?:\s+(?:CPF|CNPJ|Nome)|[\r\n]|$)/i,
                /Razão\s+Social[:\s]*([A-ZÁÊÇÕÜÚ][^\n\r]{5,60})(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i,
                /Razao\s+Social[:\s]*([A-ZÁÊÇÕÜÚ][^\n\r]{5,60})(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i
            ],

            nomeFantasia: [
                /Nome\s+Fantasia\s+(?:do\s+)?Beneficiário[:\s]*([A-ZÁÊÇÕÜÚ][^\n\r]{5,60})(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i,
                /Nome\s+Fantasia[:\s]*([A-ZÁÊÇÕÜÚ][^\n\r]{5,60})(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i
            ],

            beneficiario: [
                /Beneficiário[:\s]*([A-ZÁÊÇÕÜÚ][^\n\r]{5,60})(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i,
                /Beneficiario[:\s]*([A-ZÁÊÇÕÜÚ][^\n\r]{5,60})(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i
            ],

            // Padrões para empresas (como na imagem: TAURUS DIST DE PETROLEO LTDA)
            nomeEmpresa: [
                /([A-Z]{2,}(?:\s+[A-Z]{2,})*\s+(?:LTDA|SA|ME|EPP|EIRELI)(?:\s+[A-Z]*)?)/g,
                /([A-Z]{3,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})*(?:\s+LTDA|SA|ME|EPP|EIRELI)?)/g,
                /((?:[A-Z]{2,}\s+){2,}[A-Z]{2,})/g
            ],

            // Padrões genéricos mais flexíveis
            nomeGenerico: [
                /:\s*([A-ZÁÊÇÕÜÚ][A-ZÁÊÇÕÜÚ\s&.\-\/]{8,50})/g,
                /([A-Z][A-Z\s]{10,50})(?=\s+(?:CPF|CNPJ|\d{2,}))/g
            ]
        };

        let recipientMatch = null;
        let matchedPattern = '';

        // 1. Tentar Razão Social primeiro (mais específico)
        for (const pattern of patterns.razaoSocial) {
            recipientMatch = text.match(pattern);
            if (recipientMatch) {
                matchedPattern = 'razaoSocial';
                break;
            }
        }

        // 2. Tentar Nome Fantasia
        if (!recipientMatch) {
            for (const pattern of patterns.nomeFantasia) {
                recipientMatch = text.match(pattern);
                if (recipientMatch) {
                    matchedPattern = 'nomeFantasia';
                    break;
                }
            }
        }

        // 3. Tentar Beneficiário genérico
        if (!recipientMatch) {
            for (const pattern of patterns.beneficiario) {
                recipientMatch = text.match(pattern);
                if (recipientMatch) {
                    matchedPattern = 'beneficiario';
                    break;
                }
            }
        }

        // 4. Procurar nomes de empresas (como TAURUS DIST DE PETROLEO LTDA)
        if (!recipientMatch) {
            for (const pattern of patterns.nomeEmpresa) {
                const empresaMatches = [...text.matchAll(pattern)];
                if (empresaMatches.length > 0) {
                    // Filtrar matches que parecem ser nomes de empresa válidos
                    const validMatches = empresaMatches.filter(match => {
                        const name = match[1].trim();
                        return name.length >= 8 &&
                            !name.includes('BRADESCO') &&
                            !name.includes('BANCO') &&
                            !name.includes('AGENCIA');
                    });

                    if (validMatches.length > 0) {
                        recipientMatch = [null, validMatches[0][1]];
                        matchedPattern = 'nomeEmpresa';
                        break;
                    }
                }
            }
        }

        // 5. Último recurso: padrões genéricos
        if (!recipientMatch) {
            for (const pattern of patterns.nomeGenerico) {
                const genericMatches = [...text.matchAll(pattern)];
                if (genericMatches.length > 0) {
                    // Pegar o primeiro nome que pareça válido
                    const validMatches = genericMatches.filter(match => {
                        const name = match[1].trim();
                        return name.length >= 8 &&
                            !name.includes('BRADESCO') &&
                            !name.includes('BANCO') &&
                            !/^\d/.test(name); // Não começa com número
                    });

                    if (validMatches.length > 0) {
                        recipientMatch = [null, validMatches[0][1]];
                        matchedPattern = 'nomeGenerico';
                        break;
                    }
                }
            }
        }

        if (recipientMatch) {
            const name = this.cleanRecipientName(recipientMatch[1]);
            result.recipient = name;
            result.success = true;
            console.log(`✅ Destinatário extraído: ${name} (padrão: ${matchedPattern})`);
        } else {
            console.warn('⚠️ Destinatário não encontrado em transferência');

            // Debug: mostrar texto para análise manual
            console.log('🔍 Debug - Primeiras linhas do texto:');
            const lines = text.split('\n').slice(0, 20);
            lines.forEach((line, index) => {
                if (line.trim()) {
                    console.log(`Linha ${index + 1}: ${line.trim()}`);
                }
            });
        }

        // Extrair valor usando lógica robusta
        this.extractValueRobust(text, result);
    }

    // Extrair dados de boleto Bradesco
    extractBoletoData(text, result) {
        console.log('🧾 Extraindo dados de boleto Bradesco');

        const patterns = {
            // Cedente
            cedente: /Cedente[:\s]*([A-ZÁÊÇÕÜÚ][A-ZÁÊÇÕÜÚ\s&.\-\/]+?)(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i,
            // Favorecido
            favorecido: /Favorecido[:\s]*([A-ZÁÊÇÕÜÚ][A-ZÁÊÇÕÜÚ\s&.\-\/]+?)(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i,
            // Empresa
            empresa: /Empresa[:\s]*([A-ZÁÊÇÕÜÚ][A-ZÁÊÇÕÜÚ\s&.\-\/]+?)(?:\s+(?:CPF|CNPJ)|[\r\n]|$)/i
        };

        // Tentar extrair cedente/favorecido
        let recipientMatch = null;
        let matchedPattern = '';

        // Tentar cedente primeiro
        recipientMatch = text.match(patterns.cedente);
        if (recipientMatch) {
            matchedPattern = 'cedente';
        }

        // Tentar favorecido
        if (!recipientMatch) {
            recipientMatch = text.match(patterns.favorecido);
            if (recipientMatch) {
                matchedPattern = 'favorecido';
            }
        }

        // Tentar empresa
        if (!recipientMatch) {
            recipientMatch = text.match(patterns.empresa);
            if (recipientMatch) {
                matchedPattern = 'empresa';
            }
        }

        if (recipientMatch) {
            const name = this.cleanRecipientName(recipientMatch[1]);
            result.recipient = name;
            result.success = true;
            console.log(`✅ Cedente/Favorecido extraído: ${name} (padrão: ${matchedPattern})`);
        } else {
            console.warn('⚠️ Cedente/Favorecido não encontrado em boleto');
        }

        // Extrair valor usando lógica robusta
        this.extractValueRobust(text, result);
    }

    // Lógica robusta para extração de valores (inspirada no Itaú)
    extractValueRobust(text, result) {
        console.log('💰 Extraindo valor com lógica robusta...');
        console.log('📄 Texto para busca de valor:', text.substring(0, 800));

        // Padrões hierárquicos de valor (do mais específico ao mais genérico)
        const valuePatterns = [
            // Padrões específicos do Bradesco (baseado na imagem: 130.600,00)
            { pattern: /Valor\s*(?:Total|da\s+Transação|do\s+Boleto|da\s+Transferência)[:\s]*R?\$?\s*([\d]{1,3}(?:\.[\d]{3})*,[\d]{2})/i, name: 'valorEspecifico' },
            { pattern: /Valor[:\s]*R?\$?\s*([\d]{1,3}(?:\.[\d]{3})*,[\d]{2})/i, name: 'valor' },
            { pattern: /Total[:\s]*R?\$?\s*([\d]{1,3}(?:\.[\d]{3})*,[\d]{2})/i, name: 'total' },

            // Padrões com R$ explícito (formato brasileiro)
            { pattern: /R\$\s*([\d]{1,3}(?:\.[\d]{3})*,[\d]{2})/gi, name: 'valorComRS' },
            { pattern: /R\$\s*([\d]+,[\d]{2})/gi, name: 'valorSimples' },

            // Padrões sem símbolo mas formato brasileiro claro
            { pattern: /([\d]{1,3}(?:\.[\d]{3})+,[\d]{2})/g, name: 'formatoBrasileiroCompleto' },
            { pattern: /([\d]{4,},[\d]{2})/g, name: 'formatoBrasileiroSimples' },

            // Padrões mais genéricos
            { pattern: /\$\s*([\d.,]+)/gi, name: 'simboloDolar' },
            { pattern: /([\d]+,[\d]{2})/g, name: 'ultimoRecurso' }
        ];

        let valueFound = false;

        for (const { pattern, name } of valuePatterns) {
            let matches;

            if (pattern.global) {
                matches = [...text.matchAll(pattern)];
            } else {
                const match = text.match(pattern);
                matches = match ? [match] : [];
            }

            if (matches.length > 0) {
                console.log(`🔍 Encontrados ${matches.length} valores com padrão ${name}:`, matches.map(m => m[1]));

                // Processar todos os valores encontrados
                const values = matches
                    .map(match => ({
                        original: match[1],
                        parsed: this.parseValue(match[1])
                    }))
                    .filter(item => {
                        // Filtrar valores que fazem sentido (entre R$ 0,01 e R$ 999.999.999,99)
                        return item.parsed > 0.01 && item.parsed < 999999999.99;
                    });

                console.log(`📊 Valores válidos processados:`, values);

                if (values.length > 0) {
                    // Para valores únicos, usar diretamente
                    if (values.length === 1) {
                        result.value = this.formatValue(values[0].original);
                        console.log(`✅ Valor extraído: R$ ${result.value} (padrão: ${name})`);
                        valueFound = true;
                        break;
                    } else {
                        // Para múltiplos valores, usar estratégia inteligente
                        const bestValue = this.selectBestValue(values, name);
                        if (bestValue) {
                            result.value = this.formatValue(bestValue.original);
                            console.log(`✅ Melhor valor selecionado: R$ ${result.value} (padrão: ${name})`);
                            valueFound = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!valueFound) {
            console.warn('⚠️ Nenhum valor válido encontrado');

            // Debug melhorado: mostrar todos os números encontrados no texto
            const allNumbers = text.match(/[\d.,]+/g);
            if (allNumbers) {
                console.log('🔢 Números encontrados no texto:', allNumbers.slice(0, 15));

                // Tentar encontrar valores que pareçam monetários
                const possibleValues = allNumbers.filter(num => {
                    const parsed = this.parseValue(num);
                    return parsed > 0.01 && parsed < 999999999.99 && num.includes(',');
                });

                if (possibleValues.length > 0) {
                    console.log('💡 Possíveis valores monetários encontrados:', possibleValues);
                    // Usar o maior valor encontrado como fallback
                    const maxValue = possibleValues.reduce((max, val) => {
                        return this.parseValue(val) > this.parseValue(max) ? val : max;
                    });
                    result.value = this.formatValue(maxValue);
                    console.log(`⚠️ Usando valor fallback: R$ ${result.value}`);
                    valueFound = true;
                }
            }

            // Debug: mostrar linhas que contêm números
            const lines = text.split('\n');
            console.log('🔍 Linhas com números:');
            lines.forEach((line, index) => {
                if (line.match(/[\d,]+/) && line.trim()) {
                    console.log(`Linha ${index + 1}: ${line.trim()}`);
                }
            });
        }
    }

    // Selecionar o melhor valor entre múltiplos encontrados
    selectBestValue(values, patternName) {
        if (values.length === 0) return null;

        // Para padrões específicos, pegar o maior valor (mais provável de ser o principal)
        if (['valorTotal', 'valor', 'total'].includes(patternName)) {
            return values.reduce((max, item) => item.parsed > max.parsed ? item : max);
        }

        // Para padrões genéricos, aplicar filtros adicionais
        if (['valorGenerico', 'formatoBrasileiro'].includes(patternName)) {
            // Filtrar valores muito pequenos (menores que R$ 1,00)
            const significantValues = values.filter(item => item.parsed >= 1.00);

            if (significantValues.length === 1) {
                return significantValues[0];
            } else if (significantValues.length > 1) {
                // Se há múltiplos valores significativos, pegar o maior
                return significantValues.reduce((max, item) => item.parsed > max.parsed ? item : max);
            }
        }

        // Fallback: retornar o maior valor
        return values.reduce((max, item) => item.parsed > max.parsed ? item : max);
    }

    // Parse value string to number
    parseValue(valueStr) {
        if (!valueStr || typeof valueStr !== 'string') return 0;

        // Remove espaços e caracteres inválidos
        let cleanValue = valueStr.trim().replace(/[^\d.,]/g, '');

        // Se tem ponto e vírgula, assumir formato brasileiro (1.234,56)
        if (cleanValue.includes('.') && cleanValue.includes(',')) {
            cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        }
        // Se tem apenas vírgula, assumir decimal brasileiro (1234,56)
        else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
            cleanValue = cleanValue.replace(',', '.');
        }
        // Se tem apenas ponto, verificar se é separador de milhar ou decimal
        else if (cleanValue.includes('.')) {
            const parts = cleanValue.split('.');
            if (parts.length === 2 && parts[1].length <= 2) {
                // Provavelmente decimal: 1234.56
                cleanValue = cleanValue;
            } else {
                // Provavelmente separador de milhar: 1.234
                cleanValue = cleanValue.replace(/\./g, '');
            }
        }

        const numValue = parseFloat(cleanValue);
        return isNaN(numValue) ? 0 : numValue;
    }

    // Format value for display
    formatValue(valueStr) {
        const numValue = this.parseValue(valueStr);
        if (isNaN(numValue) || numValue <= 0) {
            return '0,00';
        }
        return numValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Limpar e formatar nome do destinatário
    cleanRecipientName(rawName) {
        if (!rawName) return 'DESTINATÁRIO NÃO ENCONTRADO';

        let name = rawName.trim();
        console.log('🧹 Limpando nome:', name);

        // Remover prefixos comuns (mas de forma mais cuidadosa)
        name = name.replace(/^(Nome|Razão Social|Beneficiário|Cedente|Favorecido|Empresa)[:\s]*/i, '');

        // Remover sufixos comuns (CPF, CNPJ, etc.) mas de forma mais precisa
        name = name.replace(/\s+(CPF|CNPJ|RG)[:\s]*[\d\.\-\/]*$/i, '');

        // Remover apenas números que parecem ser documentos (não afetar nomes com números válidos)
        name = name.replace(/\s+\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, ''); // CNPJ
        name = name.replace(/\s+\d{3}\.\d{3}\.\d{3}-\d{2}$/, ''); // CPF

        // Remover códigos e números no final
        name = name.replace(/\s+\d{3,}[\d.-]*$/, '');

        // Normalizar espaços múltiplos
        name = name.replace(/\s+/g, ' ').trim();

        // Remover caracteres especiais problemáticos, mas manter alguns válidos
        name = name.replace(/[^\w\s&.\-]/g, '');

        // Remover espaços extras novamente
        name = name.replace(/\s+/g, ' ').trim();

        // Validar se o nome resultante faz sentido
        if (name.length < 3) {
            console.warn('⚠️ Nome muito curto após limpeza:', name);
            return 'DESTINATÁRIO NÃO ENCONTRADO';
        }

        // Se o nome tem apenas 1 palavra e é muito curto, pode não ser válido
        if (name.split(' ').length === 1 && name.length < 5) {
            console.warn('⚠️ Nome parece inválido:', name);
            return 'DESTINATÁRIO NÃO ENCONTRADO';
        }

        // Converter para uppercase para consistência
        name = name.toUpperCase();

        // Limitar tamanho para evitar nomes muito longos
        if (name.length > 50) {
            name = name.substring(0, 50).trim();
            console.log('✂️ Nome truncado para 50 caracteres');
        }

        console.log('✅ Nome limpo:', name);
        return name;
    }

    // Gerar nome do arquivo
    generateFileName(extractedData) {
        console.log('📝 Gerando nome do arquivo...', extractedData);

        if (!extractedData.success || !extractedData.recipient || extractedData.recipient === 'Destinatário não encontrado') {
            const fallbackName = `Bradesco_${extractedData.type}_Pagina_${extractedData.pageNumber}.pdf`;
            console.log('⚠️ Usando nome fallback:', fallbackName);
            return fallbackName;
        }

        const recipient = extractedData.recipient.trim();
        const value = extractedData.value || '0,00';

        // Limpar nome do destinatário para nome de arquivo
        const cleanRecipient = recipient
            .replace(/[<>:"/\\|?*]/g, '') // Removes invalid characters for file names
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 40); // Limit size to avoid very long names

        // Format: [NAME] value R$ [VALUE].pdf
        const fileName = `${cleanRecipient} valor R$ ${value}.pdf`;
        console.log('✅ Nome do arquivo gerado:', fileName);
        return fileName;
    }

    // Validar dados extraídos
    validateExtractedData(data) {
        return {
            isValid: data.success && data.recipient && data.recipient !== 'Destinatário não encontrado',
            errors: data.success ? [] : ['Não foi possível extrair dados válidos'],
            warnings: []
        };
    }

    // Ícones e cores para UI
    getTypeIcon(type) {
        const icons = {
            'Transferência': 'fas fa-exchange-alt',
            'Boleto': 'fas fa-barcode',
            'Desconhecido': 'fas fa-question-circle',
            'Erro': 'fas fa-exclamation-triangle'
        };
        return icons[type] || 'fas fa-file';
    }

    getTypeColor(type) {
        const colors = {
            'Transferência': 'bg-blue-100 text-blue-800',
            'Boleto': 'bg-orange-100 text-orange-800',
            'Desconhecido': 'bg-gray-100 text-gray-800',
            'Erro': 'bg-red-100 text-red-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    }

    // Obter informações do template
    getTemplateInfo() {
        return {
            name: this.bankName,
            version: '2.0.0',
            supportedTypes: this.supportedTypes,
            description: 'Template aprimorado para extração de dados de comprovantes do Bradesco',
            features: [
                'Detecção automática de tipo de documento',
                'Extração robusta de Razão Social/Beneficiário',
                'Múltiplos padrões de extração de valor',
                'Lógica inteligente para seleção do melhor valor',
                'Filtros anti-ruído para valores monetários',
                'Suporte a formatos brasileiros de valor',
                'Logs detalhados para debug'
            ],
            patterns: {
                transferencia: [
                    'Razão Social do Beneficiário',
                    'Nome Fantasia Beneficiário',
                    'Beneficiário',
                    'Destinatário',
                    'Valor Total'
                ],
                boleto: [
                    'Cedente',
                    'Favorecido',
                    'Empresa',
                    'Valor Total'
                ]
            },
            fileNameFormat: '[NOME DESTINATÁRIO] valor R$ [VALOR].pdf'
        };
    }

    // Método de análise completa para debug (chamado quando extração falha)
    analyzeTextForDebug(text) {
        console.group('🔍 ANÁLISE COMPLETA DO TEXTO PARA DEBUG');

        console.log('📄 Tamanho total do texto:', text.length);
        console.log('📄 Primeiros 500 caracteres:', text.substring(0, 500));

        // Analisar linhas
        const lines = text.split('\n').filter(line => line.trim());
        console.log('📄 Total de linhas não vazias:', lines.length);

        console.log('📄 Primeiras 20 linhas:');
        lines.slice(0, 20).forEach((line, index) => {
            console.log(`  ${index + 1}: ${line.trim()}`);
        });

        // Procurar por palavras-chave do Bradesco
        const keywords = ['BRADESCO', 'BANCO', 'TRANSAÇÃO', 'VALOR', 'BENEFICIÁRIO', 'RAZÃO', 'SOCIAL'];
        console.log('🔍 Palavras-chave encontradas:');
        keywords.forEach(keyword => {
            const count = (text.toUpperCase().match(new RegExp(keyword, 'g')) || []).length;
            if (count > 0) {
                console.log(`  ${keyword}: ${count} ocorrências`);
            }
        });

        // Procurar padrões de valor
        const possibleValues = text.match(/[\d]{1,3}(?:\.[\d]{3})*,[\d]{2}/g);
        if (possibleValues) {
            console.log('💰 Possíveis valores encontrados:', possibleValues);
        }

        // Procurar nomes em maiúscula
        const upperCaseWords = text.match(/[A-Z]{3,}(?:\s+[A-Z]{2,})*/g);
        if (upperCaseWords) {
            console.log('📝 Palavras em maiúscula (possíveis nomes):', upperCaseWords.slice(0, 10));
        }

        console.groupEnd();
    }
}

// Registrar template globalmente
if (typeof window !== 'undefined') {
    window.BradescoTemplate = BradescoTemplate;
    console.log('✅ Template Bradesco registrado globalmente');
    console.log('🔧 Verificando se BradescoTemplate está disponível:', typeof window.BradescoTemplate);
}
