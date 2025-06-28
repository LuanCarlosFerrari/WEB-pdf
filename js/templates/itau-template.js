// Template de Extração de Dados - Banco Itaú
// Suporta: PIX, Boleto e TED

class ItauTemplate {
    constructor() {
        this.bankName = 'Itaú';
        this.supportedTypes = ['PIX', 'Boleto', 'TED'];

    }

    // Método principal para extrair dados do texto
    extractData(text, pageNum) {
        console.log(`[ITAÚ] Iniciando extração - Página ${pageNum}`);
        console.log(`[ITAÚ] Texto completo:`, text);

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
            // Detectar tipo de comprovante
            const documentType = this.detectDocumentType(text);
            result.type = documentType;
            console.log(`[ITAÚ] Tipo de documento detectado: ${documentType}`);



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
                    console.log(`[ITAÚ] Tipo de documento não reconhecido: ${documentType}`);
                    break;
            }

            console.log(`[ITAÚ] Resultado final da extração:`, result);

        } catch (error) {
            console.error(`[ITAÚ] Erro durante extração:`, error);
        }

        return result;
    }

    // Detectar o tipo de documento baseado no texto
    detectDocumentType(text) {
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

    // Extrair dados específicos do PIX
    extractPixData(text, result) {
        console.log(`[ITAÚ PIX] Iniciando extração de dados PIX`);
        console.log(`[ITAÚ PIX] Texto para análise:`, text.substring(0, 500));

        // Padrões específicos para PIX
        const patterns = {
            // Nome do recebedor (aparece após "nome do recebedor:")
            recipient: /nome do recebedor:\s*([A-ZÁÊÇÕÜÚ\s]+)/i,
            // Valor da transação - padrão principal
            valueTransaction: /valor da transação:\s*([\d.,]+)/i,
            // Valor final
            valueFinal: /valor final:\s*([\d.,]+)/i,
            // Valor do documento
            valueDocument: /valor do documento:\s*([\d.,]+)/i,
            // Valor genérico com "valor"
            valueGeneric: /valor[^:]*:\s*([\d.,]+)/i,
            // Valor com R$ (padrão antigo mantido como fallback)
            value: /valor:\s*R\$\s*([\d.,]+)/i,
            // Qualquer valor monetário no formato brasileiro
            valueNumeric: /([\d]{1,3}(?:\.[\d]{3})*,[\d]{2})/g
        };

        // Extrair destinatário
        const recipientMatch = text.match(patterns.recipient);
        console.log(`[ITAÚ PIX] Match do destinatário:`, recipientMatch);
        if (recipientMatch) {
            result.recipient = this.formatName(recipientMatch[1].trim());
            result.success = true;
            console.log(`[ITAÚ PIX] Destinatário encontrado: ${result.recipient}`);
        } else {
            console.log(`[ITAÚ PIX] Destinatário não encontrado`);
        }

        // Extrair valor - tentar múltiplos padrões em ordem de prioridade
        let valueMatch = null;
        let matchedPattern = '';

        // 1. Tentar "valor da transação"
        valueMatch = text.match(patterns.valueTransaction);
        if (valueMatch) {
            matchedPattern = 'valueTransaction';
            console.log(`[ITAÚ PIX] Valor encontrado (valor da transação):`, valueMatch);
        }

        // 2. Tentar "valor final"
        if (!valueMatch) {
            valueMatch = text.match(patterns.valueFinal);
            if (valueMatch) {
                matchedPattern = 'valueFinal';
                console.log(`[ITAÚ PIX] Valor encontrado (valor final):`, valueMatch);
            }
        }

        // 3. Tentar "valor do documento"
        if (!valueMatch) {
            valueMatch = text.match(patterns.valueDocument);
            if (valueMatch) {
                matchedPattern = 'valueDocument';
                console.log(`[ITAÚ PIX] Valor encontrado (valor do documento):`, valueMatch);
            }
        }

        // 4. Tentar padrão genérico com "valor"
        if (!valueMatch) {
            valueMatch = text.match(patterns.valueGeneric);
            if (valueMatch) {
                matchedPattern = 'valueGeneric';
                console.log(`[ITAÚ PIX] Valor encontrado (padrão genérico):`, valueMatch);
            }
        }

        // 5. Tentar padrão antigo com R$
        if (!valueMatch) {
            valueMatch = text.match(patterns.value);
            if (valueMatch) {
                matchedPattern = 'value';
                console.log(`[ITAÚ PIX] Valor encontrado (padrão R$):`, valueMatch);
            }
        }

        // 6. Como último recurso, procurar valores numéricos e pegar o maior
        if (!valueMatch) {
            const numericMatches = [...text.matchAll(patterns.valueNumeric)];
            console.log(`[ITAÚ PIX] Matches numéricos encontrados:`, numericMatches);
            if (numericMatches.length > 0) {
                // Filtrar valores que podem ser valores monetários (> 1,00) e não são zeros
                const monetaryValues = numericMatches
                    .map(match => ({ value: this.parseValue(match[1]), original: match[1] }))
                    .filter(item => item.value >= 1.00);

                console.log(`[ITAÚ PIX] Valores monetários válidos:`, monetaryValues);
                if (monetaryValues.length > 0) {
                    // Pegar o maior valor (provavelmente o valor da transferência)
                    const maxItem = monetaryValues.reduce((max, item) =>
                        item.value > max.value ? item : max
                    );
                    valueMatch = [null, maxItem.original];
                    matchedPattern = 'valueNumeric';
                    console.log(`[ITAÚ PIX] Maior valor monetário selecionado:`, maxItem);
                }
            }
        }

        if (valueMatch && valueMatch[1]) {
            result.value = this.formatValue(valueMatch[1]);
            console.log(`[ITAÚ PIX] Valor final definido: ${result.value} (padrão: ${matchedPattern})`);
        } else {
            console.log(`[ITAÚ PIX] Nenhum valor encontrado em todos os padrões testados`);
            // Debug: mostrar todos os números encontrados
            const allNumbers = text.match(/[\d.,]+/g);
            if (allNumbers) {
                console.log(`[ITAÚ PIX] Todos os números encontrados no texto:`, allNumbers);
            }
        }
    }

    // Extrair dados específicos do Boleto
    extractBoletoData(text, result) {
        console.log(`[ITAÚ BOLETO] Iniciando extração de dados de boleto`);
        console.log(`[ITAÚ BOLETO] Texto para análise:`, text.substring(0, 500));

        // Debug: mostrar o texto que está sendo analisado
        console.log(`[ITAÚ BOLETO] Texto completo normalizado:`, text.replace(/\s+/g, ' ').substring(0, 800));

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
        console.log(`[ITAÚ BOLETO] Match do beneficiário:`, recipientMatch);
        if (recipientMatch) {
            let beneficiario = recipientMatch[1].trim();
            // Limpar texto extra que pode vir junto
            beneficiario = beneficiario.replace(/\s+/g, ' ').trim();
            result.recipient = this.formatName(beneficiario);
            result.success = true;
            console.log(`[ITAÚ BOLETO] Beneficiário encontrado: ${result.recipient}`);
        } else {
            console.log(`[ITAÚ BOLETO] Beneficiário não encontrado`);
        }

        // Extrair valor - tentar múltiplos padrões
        let valueMatch = null;
        let matchedPattern = '';

        // Tentar padrão específico do valor do pagamento
        valueMatch = text.match(patterns.valuePayment);
        if (valueMatch) {
            matchedPattern = 'valuePayment';
            console.log(`[ITAÚ BOLETO] Valor encontrado (valuePayment):`, valueMatch);
        }

        // Tentar padrão do valor do boleto
        if (!valueMatch) {
            valueMatch = text.match(patterns.valueBoleto);
            if (valueMatch) {
                matchedPattern = 'valueBoleto';
                console.log(`[ITAÚ BOLETO] Valor encontrado (valueBoleto):`, valueMatch);
            }
        }

        // Tentar padrão alternativo
        if (!valueMatch) {
            valueMatch = text.match(patterns.valuePaymentAlt);
            if (valueMatch) {
                matchedPattern = 'valuePaymentAlt';
                console.log(`[ITAÚ BOLETO] Valor encontrado (valuePaymentAlt):`, valueMatch);
            }
        }

        // Tentar padrão genérico
        if (!valueMatch) {
            const generalMatches = [...text.matchAll(patterns.valueGeneral)];
            console.log(`[ITAÚ BOLETO] Matches genéricos encontrados:`, generalMatches);
            if (generalMatches.length > 0) {
                // Pegar o maior valor encontrado
                const values = generalMatches.map(match => this.parseValue(match[1]));
                const maxValue = Math.max(...values);
                console.log(`[ITAÚ BOLETO] Valores numéricos encontrados:`, values, `Maior: ${maxValue}`);
                if (maxValue > 0) {
                    valueMatch = [null, maxValue.toString().replace('.', ',')];
                    matchedPattern = 'valueGeneral';
                }
            }
        }

        // Como último recurso, procurar qualquer padrão numérico monetário
        if (!valueMatch) {
            const numericMatches = [...text.matchAll(patterns.valueNumeric)];
            console.log(`[ITAÚ BOLETO] Matches numéricos encontrados:`, numericMatches);
            if (numericMatches.length > 0) {
                // Filtrar valores que podem ser valores monetários (> 1,00)
                const monetaryValues = numericMatches
                    .map(match => ({ value: this.parseValue(match[1]), original: match[1] }))
                    .filter(item => item.value >= 1.00);

                console.log(`[ITAÚ BOLETO] Valores monetários válidos:`, monetaryValues);
                if (monetaryValues.length > 0) {
                    // Pegar o maior valor
                    const maxItem = monetaryValues.reduce((max, item) =>
                        item.value > max.value ? item : max
                    );
                    valueMatch = [null, maxItem.original];
                    matchedPattern = 'valueNumeric';
                    console.log(`[ITAÚ BOLETO] Maior valor monetário selecionado:`, maxItem);
                }
            }
        }

        if (valueMatch && valueMatch[1]) {
            result.value = this.formatValue(valueMatch[1]);
            console.log(`[ITAÚ BOLETO] Valor final definido: ${result.value} (padrão: ${matchedPattern})`);
        } else {
            console.log(`[ITAÚ BOLETO] Nenhum valor encontrado em todos os padrões testados`);
            console.log(`[ITAÚ BOLETO] Padrões testados: valuePayment, valueBoleto, valuePaymentAlt, valueGeneral, valueNumeric`);

            // Debug: mostrar todos os números encontrados
            const allNumbers = text.match(/[\d.,]+/g);
            if (allNumbers) {
                console.log(`[ITAÚ BOLETO] Todos os números encontrados no texto:`, allNumbers);
            }
        }
    }

    // Extrair dados específicos do TED
    extractTedData(text, result) {


        // Debug: mostrar o texto que está sendo analisado


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

        } else {


            // Debug: tentar encontrar qualquer ocorrência de "favorecido"
            const debugMatch = text.match(/favorecido[^a-z]*([A-Z][^0-9\r\n]+)/i);
            if (debugMatch) {

            }
        }

        // Extrair valor
        let valueMatch = text.match(patterns.value);
        if (!valueMatch) {
            valueMatch = text.match(patterns.valueAlt);
        }

        if (valueMatch) {
            result.value = this.formatValue(valueMatch[1]);

        } else {

        }
    }

    // Utilitários para formatação
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

    // Ícones e cores para UI
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

    // Informações sobre o template
    getTemplateInfo() {
        return {
            bankName: this.bankName,
            supportedTypes: this.supportedTypes,
            description: 'Template para extração de dados de comprovantes do Banco Itaú',
            patterns: 'PIX (transferências), Boleto (pagamentos) e TED (transferências)',
            version: '1.0.0'
        };
    }
}

// Exportar para uso global
window.ItauTemplate = ItauTemplate;
