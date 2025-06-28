// Template de Extração de Dados - Banco Bradesco
// Suporta: Transferência e Boleto
// ATUALIZADO: APENAS Favorecido + Razão Social (Simplificado)

class BradescoTemplate {
    constructor() {
        this.bankName = 'Bradesco';
        this.supportedTypes = ['Transferência', 'Boleto'];
        console.log('🏦 Template Bradesco SIMPLIFICADO - APENAS: Favorecido + Razão Social');
    }

    // Método principal para extrair dados do texto
    extractData(text, pageNum) {
        console.group(`🏦 Extraindo dados do Bradesco da página ${pageNum}`);

        const result = {
            pageNumber: pageNum,
            recipient: 'NENHUM NOME EXTRAÍDO', // 🔥 Mudei de "Destinatário não encontrado" para ser mais claro
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
            if (result.recipient && result.recipient !== 'NENHUM NOME EXTRAÍDO') {
                result.success = true;
                console.log(`✅ Extração bem-sucedida da página ${pageNum}`);
            } else {
                console.warn(`⚠️ Não foi possível extrair dados válidos da página ${pageNum}`);
                console.warn(`🚨 result.recipient atual: "${result.recipient}"`);

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
            'FAVORECIDO',  // 🔥 Palavra-chave principal para detectar comprovantes com campo Favorecido
            'RAZAO SOCIAL BENEFICIARIO',
            'RAZÃO SOCIAL BENEFICIÁRIO'
            // ❌ REMOVIDO: Padrões com "DESTINATÁRIO", "BENEFICIÁRIO", etc. que podem gerar confusão
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
        console.log('💸 Extraindo dados de transferência Bradesco - APENAS Favorecido + Razão Social');
        console.log('📄 Texto completo para análise:', text.substring(0, 1000));

        // 🎯 PADRÕES ROBUSTOS - APENAS NOME FANTASIA E RAZÃO SOCIAL BENEFICIÁRIO
        const patterns = {
            // 🔥 PRIORIDADE MÁXIMA: Campo "Nome Fantasia Beneficiário" (específico do Bradesco)
            nomeFantasia: [
                // Padrão ULTRA-ESPECÍFICO para o exemplo TAURUS: "Nome Fantasia Beneficiário: TAURUS DIST DE PETROLEO LTDA"
                /Nome\s+Fantasia\s+Beneficiário:\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DIST DE PETROLEO LTDA ME SA EIRELI]+?)(?=\s*(?:Razão|CPF|CNPJ|Banco|Agência|Conta|\d|\s*$))/i,

                // Padrão PRINCIPAL: Nome Fantasia Beneficiário: NOME (baseado no exemplo real)
                /Nome\s+Fantasia\s+Beneficiário:\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-Z\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]+?)(?=\s*(?:Razão|CPF|CNPJ|Banco|Agência|Conta|\d{2}\.\d{3}|\n|$))/i,

                // Padrão ULTRA-ESPECÍFICO: exatamente "Nome Fantasia Beneficiário:" seguido do nome
                /Nome\s+Fantasia\s+Beneficiário:\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9]+?)(?=\s*(?:Razão|CPF|CNPJ|Banco|Agência|Conta|\d|\n|$))/i,

                // Padrão ALTERNATIVO: Nome Fantasia Beneficiário seguido de nome (sem dois pontos)
                /Nome\s+Fantasia\s+Beneficiário\s+([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-Z\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:Razão|CPF|CNPJ|Banco|\n|$))/i,

                // Padrão RIGOROSO: Nome Fantasia Beneficiário com quebra de linha
                /Nome\s+Fantasia\s+Beneficiário[:\s]*\n\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-Z\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:Razão|CPF|CNPJ|\n|$))/i,

                // Padrão FALLBACK: Busca flexível por Nome Fantasia
                /Nome\s+Fantasia[:\s]+([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-Z\s&.\-\/0-9DE DA DO PROD LTDA ME SA]{3,60})(?=\s*(?:Razão|CPF|CNPJ|Banco|\n))/i
            ],

            // 📋 PRIORIDADE 2: Razão Social do Beneficiário
            razaoSocial: [
                // Padrão PRINCIPAL: Razão Social Beneficiário: NOME
                /Razão\s+Social\s+Beneficiário:\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-Z\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]+?)(?=\s*(?:Banco|CPF|CNPJ|\d{3}|$))/i,

                // Padrão ALTERNATIVO: Razão Social Beneficiário seguido de nome
                /Razão\s+Social\s+Beneficiário[:\s]+([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-Z\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:Banco|CPF|CNPJ|\d{3}|\n|$))/i,

                // Padrão RIGOROSO: Razão Social do Beneficiário: seguido do nome
                /Razão\s+Social\s+do\s+Beneficiário[:\s]*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|Valor|R\$|\d{2}\.\d{3}|\n|$))/i,

                // Padrão SIMPLES: Razão Social: seguido do nome
                /Razão\s+Social[:\s]*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|Valor|R\$|\d{2}\.\d{3}|\n|$))/i,

                // Padrão SEM ACENTO: Razao Social: seguido do nome
                /Razao\s+Social[:\s]*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|Valor|R\$|\d{2}\.\d{3}|\n|$))/i
            ],

            // 🔄 FALLBACK: Campo "Favorecido" (para documentos mais antigos)
            favorecido: [
                // Padrão ULTRA-SIMPLES 1: Favorecido: NOME (baseado no exemplo real)
                /Favorecido:\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-Z\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]+?)(?=\s*Valor|$)/i,

                // Padrão SIMPLES 2: Favorecido seguido de qualquer nome em maiúscula
                /Favorecido[:\s]+([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-Z\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:Valor|R\$|Ag[eê]ncia|\d|\n|$))/i
            ]
        };

        let recipientMatch = null;
        let matchedPattern = '';        // 🔥 PRIORIDADE 1: SEMPRE tentar NOME FANTASIA BENEFICIÁRIO primeiro
        console.log('🎯 Tentando extrair campo "Nome Fantasia Beneficiário" primeiro...');
        console.log('🔍 Padrões de Nome Fantasia:', patterns.nomeFantasia.map(p => p.toString()));

        // Debug especial: procurar por "Nome Fantasia" no texto antes de aplicar regex
        const nomeFantasiaIndex = text.toUpperCase().indexOf('NOME FANTASIA');
        if (nomeFantasiaIndex !== -1) {
            const contextStart = Math.max(0, nomeFantasiaIndex - 50);
            const contextEnd = Math.min(text.length, nomeFantasiaIndex + 200);
            const contextText = text.substring(contextStart, contextEnd);
            console.log('🔍 NOME FANTASIA encontrado no texto! Contexto:', contextText);

            // Análise detalhada da linha específica com "Nome Fantasia"
            const lines = text.split('\n');
            const nomeFantasiaLine = lines.find(line => line.toUpperCase().includes('NOME FANTASIA'));
            if (nomeFantasiaLine) {
                console.log('🔍 Linha exata com Nome Fantasia:', JSON.stringify(nomeFantasiaLine));
                console.log('🔍 Linha exata com Nome Fantasia (visível):', nomeFantasiaLine);

                // Teste específico para "TAURUS DIST DE PETROLEO LTDA"
                if (nomeFantasiaLine.includes('TAURUS')) {
                    console.log('🎯 DETECTADO: TAURUS no nome fantasia - exemplo específico!');
                    console.log('🔍 Análise da linha completa:', nomeFantasiaLine);
                }
            }
        } else {
            console.warn('⚠️ Palavra "NOME FANTASIA" não encontrada no texto!');
        }

        for (const [index, pattern] of patterns.nomeFantasia.entries()) {
            console.log(`🔍 Testando padrão Nome Fantasia ${index + 1}/${patterns.nomeFantasia.length}:`, pattern.toString());

            // Debug especial para o exemplo TAURUS
            if (text.includes('TAURUS')) {
                console.log('🎯 Texto contém TAURUS - testando captura...');
                const testMatch = pattern.exec(text);
                if (testMatch) {
                    console.log('🎯✅ TAURUS CAPTURADO com este padrão!', testMatch);
                } else {
                    console.log('🎯❌ TAURUS NÃO capturado com este padrão');
                }
            }

            recipientMatch = text.match(pattern);
            if (recipientMatch) {
                matchedPattern = 'nomeFantasia';
                console.log(`✅ Campo "Nome Fantasia Beneficiário" encontrado com padrão ${index + 1}!`);
                console.log(`✅ Match capturado:`, recipientMatch);
                console.log(`✅ Nome extraído: "${recipientMatch[1]}"`);
                break;
            } else {
                console.log(`❌ Padrão Nome Fantasia ${index + 1} não funcionou`);
            }
        }

        // � PRIORIDADE 2: Tentar Razão Social Beneficiário se não encontrou Nome Fantasia
        if (!recipientMatch) {
            console.log('🔍 Tentando Razão Social do Beneficiário...');
            console.log('🔍 Padrões de Razão Social:', patterns.razaoSocial.map(p => p.toString()));
            for (const [index, pattern] of patterns.razaoSocial.entries()) {
                console.log(`🔍 Testando padrão Razão Social ${index + 1}/${patterns.razaoSocial.length}:`, pattern.toString());
                recipientMatch = text.match(pattern);
                if (recipientMatch) {
                    matchedPattern = 'razaoSocial';
                    console.log(`✅ Razão Social Beneficiário encontrada com padrão ${index + 1}!`);
                    console.log(`✅ Match capturado:`, recipientMatch);
                    break;
                } else {
                    console.log(`❌ Padrão Razão Social ${index + 1} não funcionou`);
                }
            }
        }

        // � PRIORIDADE 3: FALLBACK - Tentar campo "Favorecido" (documentos mais antigos)
        if (!recipientMatch) {
            console.log('� Tentando campo "Favorecido" como fallback...');
            console.log('🔍 Padrões de Favorecido:', patterns.favorecido.map(p => p.toString()));
            for (const [index, pattern] of patterns.favorecido.entries()) {
                console.log(`🔍 Testando padrão Favorecido ${index + 1}/${patterns.favorecido.length}:`, pattern.toString());
                recipientMatch = text.match(pattern);
                if (recipientMatch) {
                    matchedPattern = 'favorecido';
                    console.log(`✅ Campo "Favorecido" encontrado com padrão ${index + 1}!`);
                    console.log(`✅ Match capturado:`, recipientMatch);
                    break;
                } else {
                    console.log(`❌ Padrão Favorecido ${index + 1} não funcionou`);
                }
            }
        }

        if (recipientMatch) {
            console.log('📝 ANTES da limpeza - Raw match:', recipientMatch[1]);
            console.log('📝 ANTES da limpeza - Match completo:', recipientMatch[0]);
            console.log('📝 ANTES da limpeza - Padrão usado:', matchedPattern);

            const name = this.cleanRecipientName(recipientMatch[1]);
            console.log('🧽 DEPOIS da limpeza - Nome final:', name);

            // Validação adicional: se o nome limpo ainda contém dados bancários, rejeitar
            if (name === 'NENHUM NOME EXTRAÍDO') {
                console.warn('🚨 Nome foi rejeitado durante a limpeza - considerando falha na extração');
                result.recipient = 'NENHUM NOME EXTRAÍDO';
                result.success = false;
            } else {
                result.recipient = name;
                result.success = true;

                // Log especial quando o campo correto é usado
                if (matchedPattern === 'nomeFantasia') {
                    console.log(`🎯✅ NOME FANTASIA BENEFICIÁRIO EXTRAÍDO COM SUCESSO: ${name}`);
                    console.log(`🔥 Padrão usado: ${matchedPattern} - PRIORIDADE MÁXIMA`);
                } else if (matchedPattern === 'razaoSocial') {
                    console.log(`📋✅ RAZÃO SOCIAL BENEFICIÁRIO EXTRAÍDA COM SUCESSO: ${name}`);
                    console.log(`🔸 Padrão usado: ${matchedPattern} - PRIORIDADE 2`);
                } else if (matchedPattern === 'favorecido') {
                    console.log(`🔄✅ FAVORECIDO EXTRAÍDO COM SUCESSO (FALLBACK): ${name}`);
                    console.log(`🔸 Padrão usado: ${matchedPattern} - PRIORIDADE 3 (FALLBACK)`);
                } else {
                    console.log(`✅ Destinatário extraído: ${name} (padrão: ${matchedPattern})`);
                }
            }
        } else {
            console.warn('🚨 Destinatário não encontrado em transferência');
            console.warn('🚨 NOME FANTASIA/RAZÃO SOCIAL/FAVORECIDO NÃO ENCONTRADOS - Verificar layout do documento');
            console.warn('🚨 recipientMatch está NULL/undefined - nenhum padrão funcionou');
            console.warn('🚨 result.recipient será definido como padrão no extractData()');

            // Debug: mostrar texto para análise manual
            console.log('🔍 Debug - Primeiras linhas do texto:');
            const lines = text.split('\n').slice(0, 20);
            lines.forEach((line, index) => {
                if (line.trim()) {
                    console.log(`Linha ${index + 1}: ${line.trim()}`);
                }
            });

            // Debug especial: procurar qualquer ocorrência dos campos relevantes
            const nomeFantasiaLines = text.split('\n').filter(line =>
                line.toUpperCase().includes('NOME FANTASIA')
            );
            const razaoSocialLines = text.split('\n').filter(line =>
                line.toUpperCase().includes('RAZÃO SOCIAL') || line.toUpperCase().includes('RAZAO SOCIAL')
            );
            const favorecidoLines = text.split('\n').filter(line =>
                line.toUpperCase().includes('FAVORECIDO')
            );

            if (nomeFantasiaLines.length > 0) {
                console.log('🔍 Linhas contendo "Nome Fantasia" encontradas:');
                nomeFantasiaLines.forEach((line, index) => {
                    console.log(`${index + 1}: ${line.trim()}`);
                });
            }

            if (razaoSocialLines.length > 0) {
                console.log('🔍 Linhas contendo "Razão Social" encontradas:');
                razaoSocialLines.forEach((line, index) => {
                    console.log(`${index + 1}: ${line.trim()}`);
                });
            }

            if (favorecidoLines.length > 0) {
                console.log('🔍 Linhas contendo "Favorecido" encontradas:');
                favorecidoLines.forEach((line, index) => {
                    console.log(`${index + 1}: ${line.trim()}`);
                });
            }
        }

        // Extrair valor usando lógica robusta
        this.extractValueRobust(text, result);
    }

    // Extrair dados de boleto Bradesco
    extractBoletoData(text, result) {
        console.log('🧾 Extraindo dados de boleto Bradesco - APENAS Favorecido + Razão Social');

        const patterns = {
            // 🔥 PRIORIDADE MÁXIMA: Campo "Favorecido"
            favorecido: [
                // Padrão RIGOROSO 1: Favorecido: seguido do nome na mesma linha
                /Favorecido:\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|R\$|\d{2}\.\d{3}|[\r\n]|$))/i,

                // Padrão RIGOROSO 2: Favorecido com espaços seguido do nome
                /Favorecido\s+([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|R\$|\d{2}\.\d{3}|[\r\n]|$))/i,

                // Padrão RIGOROSO 3: Favorecido com quebra de linha
                /Favorecido[:\s]*[\n\r]\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|R\$|\d{2}\.\d{3}|[\r\n]|$))/i,

                // Padrão RIGOROSO 4: Busca específica pela estrutura "Favorecido" seguido de nome
                /\bFavorecido[:\s]+([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA]{3,60})(?=\s*(?:CPF|CNPJ|R\$|Valor|[\r\n]))/i
            ],
            // 📋 PRIORIDADE 2: Razão Social
            razaoSocial: [
                // Padrão RIGOROSO 1: Razão Social: seguido do nome
                /Razão\s+Social[:\s]*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|R\$|\d{2}\.\d{3}|[\r\n]|$))/i,

                // Padrão RIGOROSO 2: Razao Social (sem acento): seguido do nome  
                /Razao\s+Social[:\s]*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|R\$|\d{2}\.\d{3}|[\r\n]|$))/i
            ]
        };

        let recipientMatch = null;
        let matchedPattern = '';

        // 🔥 PRIORIDADE 1: SEMPRE tentar FAVORECIDO primeiro
        console.log('🎯 Tentando extrair campo "Favorecido" em boleto...');
        console.log('🔍 Padrões de Favorecido:', patterns.favorecido.map(p => p.toString()));
        for (const pattern of patterns.favorecido) {
            recipientMatch = text.match(pattern);
            if (recipientMatch) {
                matchedPattern = 'favorecido';
                console.log(`✅ Campo "Favorecido" encontrado em boleto!`);
                console.log(`✅ Match capturado:`, recipientMatch);
                break;
            }
        }

        // 📋 PRIORIDADE 2: Tentar Razão Social apenas se não encontrou Favorecido
        if (!recipientMatch) {
            console.log('🔍 Tentando Razão Social em boleto...');
            console.log('🔍 Padrões de Razão Social:', patterns.razaoSocial.map(p => p.toString()));
            for (const pattern of patterns.razaoSocial) {
                recipientMatch = text.match(pattern);
                if (recipientMatch) {
                    matchedPattern = 'razaoSocial';
                    console.log(`✅ Razão Social encontrada em boleto!`);
                    console.log(`✅ Match capturado:`, recipientMatch);
                    break;
                }
            }
        }

        if (recipientMatch) {
            console.log('📝 ANTES da limpeza - Raw match:', recipientMatch[1]);
            console.log('📝 ANTES da limpeza - Match completo:', recipientMatch[0]);
            console.log('📝 ANTES da limpeza - Padrão usado:', matchedPattern);

            const name = this.cleanRecipientName(recipientMatch[1]);
            console.log('🧽 DEPOIS da limpeza - Nome final:', name);

            // Validação adicional: se o nome limpo ainda contém dados bancários, rejeitar
            if (name === 'NENHUM NOME EXTRAÍDO') {
                console.warn('🚨 Nome foi rejeitado durante a limpeza - considerando falha na extração');
                result.recipient = 'NENHUM NOME EXTRAÍDO';
                result.success = false;
            } else {
                result.recipient = name;
                result.success = true;

                // Log especial quando o campo "Favorecido" é usado em boleto
                if (matchedPattern === 'favorecido') {
                    console.log(`🎯✅ CAMPO FAVORECIDO EXTRAÍDO EM BOLETO: ${name}`);
                    console.log(`🔥 Padrão usado: ${matchedPattern} - PRIORIDADE MÁXIMA`);
                } else if (matchedPattern === 'razaoSocial') {
                    console.log(`📋✅ RAZÃO SOCIAL EXTRAÍDA EM BOLETO: ${name}`);
                    console.log(`🔸 Padrão usado: ${matchedPattern} - PRIORIDADE 2`);
                } else {
                    console.log(`✅ Destinatário extraído: ${name} (padrão: ${matchedPattern})`);
                }
            }
        } else {
            console.warn('⚠️ Favorecido/Razão Social não encontrado em boleto');
            console.warn('🚨 FAVORECIDO/RAZÃO SOCIAL NÃO ENCONTRADOS EM BOLETO - Verificar layout');

            // Debug especial: procurar qualquer ocorrência de "Favorecido" ou "Razão Social"
            const favorecidoLines = text.split('\n').filter(line =>
                line.toUpperCase().includes('FAVORECIDO')
            );
            const razaoSocialLines = text.split('\n').filter(line =>
                line.toUpperCase().includes('RAZÃO SOCIAL') || line.toUpperCase().includes('RAZAO SOCIAL')
            );

            if (favorecidoLines.length > 0) {
                console.log('🔍 Linhas contendo "Favorecido" encontradas em boleto:');
                favorecidoLines.forEach((line, index) => {
                    console.log(`${index + 1}: ${line.trim()}`);
                });
            }

            if (razaoSocialLines.length > 0) {
                console.log('🔍 Linhas contendo "Razão Social" encontradas em boleto:');
                razaoSocialLines.forEach((line, index) => {
                    console.log(`${index + 1}: ${line.trim()}`);
                });
            }
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
        console.log('🧹 [cleanRecipientName] Iniciando limpeza com:', rawName);

        if (!rawName) {
            console.warn('🚨 [cleanRecipientName] rawName está vazio/null, retornando NENHUM NOME EXTRAÍDO');
            return 'NENHUM NOME EXTRAÍDO';
        }

        let name = rawName.trim();
        console.log('🧹 Limpando nome:', name);

        // Teste específico para TAURUS (exemplo real)
        if (name.includes('TAURUS')) {
            console.log('🎯 [cleanRecipientName] DETECTADO: Nome contém TAURUS - processamento especial');
            console.log('🎯 [cleanRecipientName] Nome antes da limpeza:', name);
        }

        // Remover prefixos comuns (incluindo "Favorecido" com prioridade)
        name = name.replace(/^(Favorecido|Nome|Razão Social|Beneficiário|Cedente|Empresa)[:\s]*/i, '');

        // Remover sufixos comuns (CPF, CNPJ, etc.) mas de forma mais precisa
        name = name.replace(/\s+(CPF|CNPJ|RG)[:\s]*[\d\.\-\/]*$/i, '');

        // Remover apenas números que parecem ser documentos (não afetar nomes com números válidos)
        name = name.replace(/\s+\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, ''); // CNPJ
        name = name.replace(/\s+\d{3}\.\d{3}\.\d{3}-\d{2}$/, ''); // CPF

        // Remover códigos e números no final, mas preservar números que fazem parte do nome
        name = name.replace(/\s+\d{3,}[\d.-]*$/, '');

        // Remover padrões específicos que aparecem após favorecidos
        name = name.replace(/\s+R\$.*$/i, ''); // Remove valor que às vezes aparece depois
        name = name.replace(/\s+Valor.*$/i, ''); // Remove "Valor" que pode aparecer
        name = name.replace(/\s+\d{3}\..*$/i, ''); // Remove códigos que começam com 3 dígitos
        name = name.replace(/\s+Agência.*$/i, ''); // Remove "Agência" que pode aparecer
        name = name.replace(/\s+Conta.*$/i, ''); // Remove "Conta" que pode aparecer

        // Normalizar espaços múltiplos
        name = name.replace(/\s+/g, ' ').trim();

        // Remover caracteres especiais problemáticos, mas manter alguns válidos para empresas
        name = name.replace(/[^\wÀ-ÿ\s&.\-,]/g, '');

        // Remover espaços extras novamente
        name = name.replace(/\s+/g, ' ').trim();

        // Teste específico para TAURUS após limpeza inicial
        if (name.includes('TAURUS')) {
            console.log('🎯 [cleanRecipientName] TAURUS após limpeza inicial:', name);
        }

        // Validações específicas para campo "Favorecido"
        // Se o nome contém palavras-chave do banco ou dados bancários, provavelmente é inválido
        const invalidKeywords = ['BRADESCO', 'BANCO', 'AGENCIA', 'AGÊNCIA', 'CONTA', 'OPERACAO', 'OPERAÇÃO', 'TRANSACAO', 'TRANSAÇÃO', 'TRANSFERENCIA', 'TRANSFERÊNCIA'];
        for (const keyword of invalidKeywords) {
            if (name.toUpperCase().includes(keyword)) {
                console.warn('🚨 [cleanRecipientName] Nome contém palavra-chave inválida:', keyword);
                console.warn('🚨 [cleanRecipientName] Nome rejeitado:', name);
                console.warn('🚨 [cleanRecipientName] Retornando NENHUM NOME EXTRAÍDO');
                return 'NENHUM NOME EXTRAÍDO';
            }
        }

        // Validação adicional: rejeitar se começar com números (como códigos de agência)
        if (/^\d/.test(name)) {
            console.warn('🚨 [cleanRecipientName] Nome inicia com número (provavelmente código):', name);
            console.warn('🚨 [cleanRecipientName] Retornando NENHUM NOME EXTRAÍDO');
            return 'NENHUM NOME EXTRAÍDO';
        }

        // Validação adicional: rejeitar se contém apenas números e espaços
        if (/^[\d\s]+$/.test(name)) {
            console.warn('🚨 [cleanRecipientName] Nome contém apenas números:', name);
            console.warn('🚨 [cleanRecipientName] Retornando NENHUM NOME EXTRAÍDO');
            return 'NENHUM NOME EXTRAÍDO';
        }

        // Validar se o nome resultante faz sentido
        if (name.length < 3) {
            console.warn('🚨 [cleanRecipientName] Nome muito curto após limpeza:', name);
            console.warn('🚨 [cleanRecipientName] Retornando NENHUM NOME EXTRAÍDO');
            return 'NENHUM NOME EXTRAÍDO';
        }

        // Ser mais flexível com nomes de uma palavra - permitir se tiver 3+ caracteres
        // Isso é importante para empresas como "GOODYEAR" ou nomes simplificados
        if (name.split(' ').length === 1 && name.length < 3) {
            console.warn('🚨 [cleanRecipientName] Nome parece inválido (1 palavra < 3 chars):', name);
            console.warn('🚨 [cleanRecipientName] Retornando NENHUM NOME EXTRAÍDO');
            return 'NENHUM NOME EXTRAÍDO';
        }

        // Converter para uppercase para consistência
        name = name.toUpperCase();

        // Limitar tamanho para evitar nomes muito longos
        if (name.length > 60) {
            name = name.substring(0, 60).trim();
            console.log('✂️ Nome truncado para 60 caracteres');
        }

        // Teste final para TAURUS
        if (name.includes('TAURUS')) {
            console.log('🎯✅ [cleanRecipientName] TAURUS VALIDADO COM SUCESSO:', name);
        }

        console.log('✅ [cleanRecipientName] Nome limpo e validado com sucesso:', name);
        return name;
    }

    // Gerar nome do arquivo
    generateFileName(extractedData) {
        console.log('📝 Gerando nome do arquivo...', extractedData);

        if (!extractedData.success || !extractedData.recipient || extractedData.recipient === 'NENHUM NOME EXTRAÍDO' || extractedData.recipient === 'DESTINATÁRIO NÃO ENCONTRADO') {
            const fallbackName = `Bradesco_${extractedData.type}_Pagina_${extractedData.pageNumber}.pdf`;
            console.log('⚠️ Usando nome fallback:', fallbackName);
            console.log('🚨 Motivo: recipient =', extractedData.recipient);
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
            isValid: data.success && data.recipient && data.recipient !== 'NENHUM NOME EXTRAÍDO' && data.recipient !== 'DESTINATÁRIO NÃO ENCONTRADO',
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
            version: '3.0.0',
            supportedTypes: this.supportedTypes,
            description: 'Template SIMPLIFICADO para extração de dados do Bradesco - APENAS Favorecido + Razão Social',
            features: [
                'Detecção automática de tipo de documento',
                'Extração PRIORITÁRIA do campo "Favorecido"',
                'Extração secundária de "Razão Social"',
                'Múltiplos padrões de extração de valor',
                'Lógica inteligente para seleção do melhor valor',
                'Suporte a formatos brasileiros de valor',
                'Logs detalhados para debug',
                'Foco EXCLUSIVO em Favorecido + Razão Social'
            ],
            patterns: {
                transferencia: [
                    'Favorecido (PRIORIDADE MÁXIMA)',
                    'Razão Social do Beneficiário',
                    'Valor Total'
                ],
                boleto: [
                    'Favorecido (PRIORIDADE MÁXIMA)',
                    'Razão Social',
                    'Valor Total'
                ]
            },
            fileNameFormat: '[NOME FAVORECIDO/RAZÃO SOCIAL] valor R$ [VALOR].pdf',
            excludedFields: [
                'Beneficiário genérico',
                'Nome Fantasia',
                'Cedente',
                'Empresa',
                'Destinatário genérico',
                'Padrões de empresa',
                'Padrões genéricos'
            ]
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
