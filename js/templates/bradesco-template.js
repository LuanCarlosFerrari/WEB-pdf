// Template de Extração de Dados - Banco Bradesco
// Suporta: Transferência e Boleto
// ATUALIZADO: APENAS Favorecido + Razão Social (Simplificado)

class BradescoTemplate {
    constructor() {
        this.bankName = 'Bradesco';
        this.supportedTypes = ['Transferência', 'Boleto'];

    }

    // Método principal para extrair dados do texto
    extractData(text, pageNum) {
        console.group(`🏦 Extraindo dados do Bradesco da página ${pageNum}`);

        // 📋 LOG BRUTO: Dados da página recebida
        console.log(`📄 DADOS BRUTOS DA PÁGINA ${pageNum}:`);
        console.log(`📏 Tamanho do texto: ${text.length} caracteres`);
        console.log(`🔤 Primeiros 300 caracteres:`, text.substring(0, 300));
        console.log(`🔤 Últimos 300 caracteres:`, text.substring(Math.max(0, text.length - 300)));

        // 📋 LOG BRUTO: Análise estrutural do texto
        const lines = text.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        console.log(`📊 Estrutura do texto:`);
        console.log(`- Total de linhas: ${lines.length}`);
        console.log(`- Linhas com conteúdo: ${nonEmptyLines.length}`);
        console.log(`- Linhas vazias: ${lines.length - nonEmptyLines.length}`);

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
            // 📋 LOG BRUTO: Preview detalhado do texto
            console.group('📋 EXTRAÇÃO BRUTA - PREVIEW DO TEXTO');
            console.log('🔍 Análise linha por linha (primeiras 15 linhas):');
            lines.slice(0, 15).forEach((line, index) => {
                if (line.trim()) {
                    console.log(`Linha ${index + 1}: "${line.trim()}"`);
                }
            });
            console.groupEnd();


            // Detectar tipo de comprovante
            const documentType = this.detectDocumentType(text);
            result.type = documentType;



            if (documentType === 'Desconhecido') {

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

                    break;
            }

            // Validar se conseguiu extrair dados essenciais
            if (result.recipient && result.recipient !== 'NENHUM NOME EXTRAÍDO') {
                result.success = true;

            } else {



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

            result.recipient = `Erro na página ${pageNum}`;
        }

        console.groupEnd();
        return result;
    }

    // Detectar tipo de documento Bradesco
    detectDocumentType(text) {
        console.group('🔍 EXTRAÇÃO BRUTA - DETECÇÃO DE TIPO DE DOCUMENTO');

        const normalizedText = text.toUpperCase().replace(/\s+/g, ' ');

        // 📋 LOG BRUTO: Texto normalizado
        console.log(`📝 Texto normalizado (primeiros 500 caracteres):`, normalizedText.substring(0, 500));

        // 📋 LOG BRUTO: Análise de palavras-chave
        console.log('🔎 Procurando palavras-chave específicas no texto...');

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

        // 📋 LOG BRUTO: Verificação de padrões de transferência
        console.log('🔄 Verificando padrões de TRANSFERÊNCIA:');
        let transferenciaFound = false;
        for (const pattern of transferenciaPatterns) {
            const found = normalizedText.includes(pattern);
            console.log(`- "${pattern}": ${found ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
            if (found) {
                transferenciaFound = true;
            }
        }

        // 📋 LOG BRUTO: Verificação de padrões de boleto
        console.log('📋 Verificando padrões de BOLETO:');
        let boletoFound = false;
        for (const pattern of boletoPatterns) {
            const found = normalizedText.includes(pattern);
            console.log(`- "${pattern}": ${found ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
            if (found) {
                boletoFound = true;
            }
        }

        let detectedType = 'Desconhecido';

        // Verificar transferência
        if (transferenciaFound) {
            detectedType = 'Transferência';
            console.log('🎯 RESULTADO: Documento identificado como TRANSFERÊNCIA');
        }
        // Verificar boleto
        else if (boletoFound) {
            detectedType = 'Boleto';
            console.log('🎯 RESULTADO: Documento identificado como BOLETO');
        }
        // Fallback: se tem palavras-chave genéricas, assumir transferência
        else if (normalizedText.includes('BRADESCO') &&
            (normalizedText.includes('VALOR') || normalizedText.includes('R$'))) {
            detectedType = 'Transferência';
            console.log('🎯 RESULTADO: Documento identificado como TRANSFERÊNCIA (fallback)');
        }
        else {
            console.log('❌ RESULTADO: Tipo de documento NÃO IDENTIFICADO');

            // 📋 LOG BRUTO: Análise adicional para debug
            console.log('🔍 Análise adicional para debug:');
            console.log(`- Contém "BRADESCO": ${normalizedText.includes('BRADESCO')}`);
            console.log(`- Contém "VALOR": ${normalizedText.includes('VALOR')}`);
            console.log(`- Contém "R$": ${normalizedText.includes('R$')}`);
        }

        console.groupEnd();
        return detectedType;
    }

    // Extrair dados de transferência Bradesco
    extractTransferenciaData(text, result) {
        console.group('💰 EXTRAÇÃO BRUTA - DADOS DE TRANSFERÊNCIA');

        // 📋 LOG BRUTO: Análise inicial do texto
        console.log('📝 Iniciando extração de dados de transferência...');
        console.log(`📏 Tamanho do texto para análise: ${text.length} caracteres`);

        // 📋 LOG BRUTO: Busca por campos-chave
        console.log('🔍 Procurando por campos-chave no texto:');
        const keyFields = ['NOME FANTASIA', 'RAZÃO SOCIAL', 'RAZAO SOCIAL', 'FAVORECIDO'];
        keyFields.forEach(field => {
            const found = text.toUpperCase().includes(field);
            const positions = [];
            let index = text.toUpperCase().indexOf(field);
            while (index !== -1) {
                positions.push(index);
                index = text.toUpperCase().indexOf(field, index + 1);
            }
            console.log(`- "${field}": ${found ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}${positions.length > 0 ? ` (posições: ${positions.join(', ')})` : ''}`);
        });

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

            // 🔄 FALLBACK: Campo "Favorecido" (para documentos mais antigos e TEDs)
            favorecido: [
                // Padrão ESPECÍFICO PARA TED: Favorecido: seguido de nome até CPF/CNPJ
                /Favorecido:\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9]+?)(?=\s*(?:CPF|CNPJ))/i,

                // Padrão ULTRA-SIMPLES 1: Favorecido: NOME (baseado no exemplo real)
                /Favorecido:\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-Z\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]+?)(?=\s*Valor|$)/i,

                // Padrão SIMPLES 2: Favorecido seguido de qualquer nome em maiúscula
                /Favorecido[:\s]+([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-Z\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:Valor|R\$|Ag[eê]ncia|\d|\n|$))/i,

                // Padrão FLEXÍVEL: Favorecido seguido de nome até próximo campo bancário
                /Favorecido[:\s]+([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9]{3,50}?)(?=\s*(?:CPF|CNPJ|Banco|Agência|\d{3}[\.\-]|\n|$))/i
            ]
        };

        let recipientMatch = null;
        let matchedPattern = '';

        // 📋 LOG BRUTO: Testando padrões de Nome Fantasia
        console.log('🎯 TESTANDO PADRÕES DE NOME FANTASIA:');

        // 🔥 PRIORIDADE 1: SEMPRE tentar NOME FANTASIA BENEFICIÁRIO primeiro

        // Debug especial: procurar por "Nome Fantasia" no texto antes de aplicar regex
        const nomeFantasiaIndex = text.toUpperCase().indexOf('NOME FANTASIA');
        if (nomeFantasiaIndex !== -1) {
            const contextStart = Math.max(0, nomeFantasiaIndex - 50);
            const contextEnd = Math.min(text.length, nomeFantasiaIndex + 200);
            const contextText = text.substring(contextStart, contextEnd);
            console.log('📋 LOG BRUTO: Contexto encontrado para "Nome Fantasia":');
            console.log(`"${contextText}"`);

            // Análise detalhada da linha específica com "Nome Fantasia"
            const lines = text.split('\n');
            const nomeFantasiaLine = lines.find(line => line.toUpperCase().includes('NOME FANTASIA'));
            if (nomeFantasiaLine) {
                console.log('📋 LOG BRUTO: Linha específica com "Nome Fantasia":');
                console.log(`"${nomeFantasiaLine}"`);

                // Teste específico para "TAURUS DIST DE PETROLEO LTDA"
                if (nomeFantasiaLine.includes('TAURUS')) {
                    console.log('🎯 ENCONTRADO: Exemplo TAURUS na linha de Nome Fantasia!');
                    console.log(`Linha completa: "${nomeFantasiaLine}"`);
                }
            }
        } else {
            console.log('❌ Campo "Nome Fantasia" NÃO ENCONTRADO no texto');
        }

        for (const [index, pattern] of patterns.nomeFantasia.entries()) {
            console.log(`🔍 Testando padrão Nome Fantasia ${index + 1}/${patterns.nomeFantasia.length}:`);
            console.log(`Regex: ${pattern.toString()}`);

            // Debug especial para o exemplo TAURUS
            if (text.includes('TAURUS')) {
                console.log('🎯 Texto contém TAURUS - testando padrão específico...');
                const testMatch = pattern.exec(text);
                if (testMatch) {
                    console.log('✅ MATCH ENCONTRADO para TAURUS!', testMatch[1]);
                } else {
                    console.log('❌ Padrão não capturou TAURUS');
                }
            }

            recipientMatch = text.match(pattern);
            if (recipientMatch) {
                matchedPattern = 'nomeFantasia';
                console.log(`✅ SUCESSO! Nome Fantasia encontrado com padrão ${index + 1}:`);
                console.log(`- Valor bruto capturado: "${recipientMatch[1]}"`);
                console.log(`- Match completo: "${recipientMatch[0]}"`);
                break;
            } else {
                console.log(`❌ Padrão ${index + 1} não encontrou match`);
            }
        }

        // 📋 PRIORIDADE 2: Tentar Razão Social Beneficiário se não encontrou Nome Fantasia
        if (!recipientMatch) {
            console.log('🎯 TESTANDO PADRÕES DE RAZÃO SOCIAL:');
            console.log('ℹ️ Nome Fantasia não encontrado, tentando Razão Social...');

            for (const [index, pattern] of patterns.razaoSocial.entries()) {
                console.log(`🔍 Testando padrão Razão Social ${index + 1}/${patterns.razaoSocial.length}:`);
                console.log(`Regex: ${pattern.toString()}`);

                recipientMatch = text.match(pattern);
                if (recipientMatch) {
                    matchedPattern = 'razaoSocial';
                    console.log(`✅ SUCESSO! Razão Social encontrada com padrão ${index + 1}:`);
                    console.log(`- Valor bruto capturado: "${recipientMatch[1]}"`);
                    console.log(`- Match completo: "${recipientMatch[0]}"`);
                    break;
                } else {
                    console.log(`❌ Padrão ${index + 1} não encontrou match`);
                }
            }
        }

        // 📋 PRIORIDADE 3: FALLBACK - Tentar campo "Favorecido" (documentos mais antigos)
        if (!recipientMatch) {
            console.log('🎯 TESTANDO PADRÕES DE FAVORECIDO (FALLBACK):');
            console.log('ℹ️ Nome Fantasia e Razão Social não encontrados, tentando Favorecido...');

            for (const [index, pattern] of patterns.favorecido.entries()) {
                console.log(`🔍 Testando padrão Favorecido ${index + 1}/${patterns.favorecido.length}:`);
                console.log(`Regex: ${pattern.toString()}`);

                recipientMatch = text.match(pattern);
                if (recipientMatch) {
                    matchedPattern = 'favorecido';
                    console.log(`✅ SUCESSO! Favorecido encontrado com padrão ${index + 1}:`);
                    console.log(`- Valor bruto capturado: "${recipientMatch[1]}"`);
                    console.log(`- Match completo: "${recipientMatch[0]}"`);
                    break;
                } else {
                    console.log(`❌ Padrão ${index + 1} não encontrou match`);
                }
            }
        }

        if (recipientMatch) {
            console.log('🎯 PROCESSAMENTO DO NOME ENCONTRADO:');
            console.log(`📝 Valor bruto original: "${recipientMatch[1]}"`);
            console.log(`🏷️ Tipo de campo usado: ${matchedPattern}`);
            console.log(`📍 Posição no texto: ${text.indexOf(recipientMatch[0])}`);

            const name = this.cleanRecipientName(recipientMatch[1]);
            console.log(`🧹 Nome após limpeza: "${name}"`);

            // Validação adicional: se o nome limpo ainda contém dados bancários, rejeitar
            if (name === 'NENHUM NOME EXTRAÍDO') {
                console.log('❌ REJEIÇÃO: Nome limpo resultou em "NENHUM NOME EXTRAÍDO"');
                result.recipient = 'NENHUM NOME EXTRAÍDO';
                result.success = false;
            } else {
                result.recipient = name;
                result.success = true;
                console.log('✅ SUCESSO: Nome válido extraído e processado');

                // Log especial quando o campo correto é usado
                if (matchedPattern === 'nomeFantasia') {
                    console.log('🏆 CAMPO PRIORITÁRIO: Nome extraído do campo "Nome Fantasia Beneficiário"');
                } else if (matchedPattern === 'razaoSocial') {
                    console.log('📋 CAMPO SECUNDÁRIO: Nome extraído do campo "Razão Social"');
                } else if (matchedPattern === 'favorecido') {
                    console.log('🔄 CAMPO FALLBACK: Nome extraído do campo "Favorecido"');
                } else {
                    console.log('❓ CAMPO DESCONHECIDO: Nome extraído de campo não identificado');
                }
            }
        } else {
            console.log('❌ FALHA TOTAL NA EXTRAÇÃO DE NOME:');
            console.log('🔍 Nenhum padrão conseguiu extrair um nome válido');
            console.log('📋 Iniciando análise detalhada para debug...');

            // Debug: mostrar texto para análise manual
            console.log('📄 TEXTO COMPLETO PARA ANÁLISE MANUAL:');
            const lines = text.split('\n').slice(0, 20);
            lines.forEach((line, index) => {
                if (line.trim()) {
                    console.log(`Linha ${index + 1}: "${line.trim()}"`);
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
                console.log('📋 LINHAS COM "NOME FANTASIA" ENCONTRADAS:');
                nomeFantasiaLines.forEach((line, index) => {
                    console.log(`${index + 1}. "${line.trim()}"`);
                });
            }

            if (razaoSocialLines.length > 0) {
                console.log('📋 LINHAS COM "RAZÃO SOCIAL" ENCONTRADAS:');
                razaoSocialLines.forEach((line, index) => {
                    console.log(`${index + 1}. "${line.trim()}"`);
                });
            }

            if (favorecidoLines.length > 0) {
                console.log('📋 LINHAS COM "FAVORECIDO" ENCONTRADAS:');
                favorecidoLines.forEach((line, index) => {
                    console.log(`${index + 1}. "${line.trim()}"`);
                });
            }
        }

        console.groupEnd();

        // Extrair valor usando lógica robusta
        this.extractValueRobust(text, result);
    }

    // Extrair dados de boleto Bradesco
    extractBoletoData(text, result) {


        const patterns = {
            // 🔥 PRIORIDADE MÁXIMA: Campo "Favorecido"
            favorecido: [
                // Padrão ESPECÍFICO PARA TED: Favorecido: seguido de nome até CPF/CNPJ
                /Favorecido:\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9]+?)(?=\s*(?:CPF|CNPJ))/i,

                // Padrão RIGOROSO 1: Favorecido: seguido do nome na mesma linha
                /Favorecido:\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|R\$|\d{2}\.\d{3}|[\r\n]|$))/i,

                // Padrão RIGOROSO 2: Favorecido com espaços seguido do nome
                /Favorecido\s+([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|R\$|\d{2}\.\d{3}|[\r\n]|$))/i,

                // Padrão RIGOROSO 3: Favorecido com quebra de linha
                /Favorecido[:\s]*[\n\r]\s*([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9DE DA DO PROD LTDA ME SA EIRELI]{3,80}?)(?=\s*(?:CPF|CNPJ|R\$|\d{2}\.\d{3}|[\r\n]|$))/i,

                // Padrão FLEXÍVEL: Favorecido seguido de nome até próximo campo bancário
                /Favorecido[:\s]+([A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ][A-ZÁÊÇÕÜÚÀÂÃÉÊÍÓÔÕ\s&.\-\/0-9]{3,50}?)(?=\s*(?:CPF|CNPJ|Banco|Agência|\d{3}[\.\-]|[\r\n]|$))/i
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


        for (const pattern of patterns.favorecido) {
            recipientMatch = text.match(pattern);
            if (recipientMatch) {
                matchedPattern = 'favorecido';


                break;
            }
        }

        // 📋 PRIORIDADE 2: Tentar Razão Social apenas se não encontrou Favorecido
        if (!recipientMatch) {


            for (const pattern of patterns.razaoSocial) {
                recipientMatch = text.match(pattern);
                if (recipientMatch) {
                    matchedPattern = 'razaoSocial';


                    break;
                }
            }
        }

        if (recipientMatch) {




            const name = this.cleanRecipientName(recipientMatch[1]);


            // Validação adicional: se o nome limpo ainda contém dados bancários, rejeitar
            if (name === 'NENHUM NOME EXTRAÍDO') {

                result.recipient = 'NENHUM NOME EXTRAÍDO';
                result.success = false;
            } else {
                result.recipient = name;
                result.success = true;

                // Log especial quando o campo "Favorecido" é usado em boleto
                if (matchedPattern === 'favorecido') {


                } else if (matchedPattern === 'razaoSocial') {


                } else {

                }
            }
        } else {



            // Debug especial: procurar qualquer ocorrência de "Favorecido" ou "Razão Social"
            const favorecidoLines = text.split('\n').filter(line =>
                line.toUpperCase().includes('FAVORECIDO')
            );
            const razaoSocialLines = text.split('\n').filter(line =>
                line.toUpperCase().includes('RAZÃO SOCIAL') || line.toUpperCase().includes('RAZAO SOCIAL')
            );

            if (favorecidoLines.length > 0) {

                favorecidoLines.forEach((line, index) => {

                });
            }

            if (razaoSocialLines.length > 0) {

                razaoSocialLines.forEach((line, index) => {

                });
            }
        }

        // Extrair valor usando lógica robusta
        this.extractValueRobust(text, result);
    }

    // Lógica robusta para extração de valores (inspirada no Itaú)
    extractValueRobust(text, result) {



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



                if (values.length > 0) {
                    // Para valores únicos, usar diretamente
                    if (values.length === 1) {
                        result.value = this.formatValue(values[0].original);

                        valueFound = true;
                        break;
                    } else {
                        // Para múltiplos valores, usar estratégia inteligente
                        const bestValue = this.selectBestValue(values, name);
                        if (bestValue) {
                            result.value = this.formatValue(bestValue.original);

                            valueFound = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!valueFound) {


            // Debug melhorado: mostrar todos os números encontrados no texto
            const allNumbers = text.match(/[\d.,]+/g);
            if (allNumbers) {


                // Tentar encontrar valores que pareçam monetários
                const possibleValues = allNumbers.filter(num => {
                    const parsed = this.parseValue(num);
                    return parsed > 0.01 && parsed < 999999999.99 && num.includes(',');
                });

                if (possibleValues.length > 0) {

                    // Usar o maior valor encontrado como fallback
                    const maxValue = possibleValues.reduce((max, val) => {
                        return this.parseValue(val) > this.parseValue(max) ? val : max;
                    });
                    result.value = this.formatValue(maxValue);

                    valueFound = true;
                }
            }

            // Debug: mostrar linhas que contêm números
            const lines = text.split('\n');

            lines.forEach((line, index) => {
                if (line.match(/[\d,]+/) && line.trim()) {

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


        if (!rawName) {

            return 'NENHUM NOME EXTRAÍDO';
        }

        let name = rawName.trim();


        // Teste específico para TAURUS (exemplo real)
        if (name.includes('TAURUS')) {


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

        }

        // Validações específicas para campo "Favorecido"
        // Se o nome contém palavras-chave do banco ou dados bancários, provavelmente é inválido
        const invalidKeywords = ['BRADESCO', 'BANCO', 'AGENCIA', 'AGÊNCIA', 'CONTA', 'OPERACAO', 'OPERAÇÃO', 'TRANSACAO', 'TRANSAÇÃO', 'TRANSFERENCIA', 'TRANSFERÊNCIA'];
        for (const keyword of invalidKeywords) {
            if (name.toUpperCase().includes(keyword)) {



                return 'NENHUM NOME EXTRAÍDO';
            }
        }

        // Validação adicional: rejeitar se começar com números (como códigos de agência)
        if (/^\d/.test(name)) {


            return 'NENHUM NOME EXTRAÍDO';
        }

        // Validação adicional: rejeitar se contém apenas números e espaços
        if (/^[\d\s]+$/.test(name)) {


            return 'NENHUM NOME EXTRAÍDO';
        }

        // Validar se o nome resultante faz sentido
        if (name.length < 3) {


            return 'NENHUM NOME EXTRAÍDO';
        }

        // Ser mais flexível com nomes de uma palavra - permitir se tiver 3+ caracteres
        // Isso é importante para empresas como "GOODYEAR" ou nomes simplificados
        if (name.split(' ').length === 1 && name.length < 3) {


            return 'NENHUM NOME EXTRAÍDO';
        }

        // Converter para uppercase para consistência
        name = name.toUpperCase();

        // Limitar tamanho para evitar nomes muito longos
        if (name.length > 60) {
            name = name.substring(0, 60).trim();

        }

        // Teste final para TAURUS
        if (name.includes('TAURUS')) {

        }


        return name;
    }

    // Gerar nome do arquivo
    generateFileName(extractedData) {


        if (!extractedData.success || !extractedData.recipient || extractedData.recipient === 'NENHUM NOME EXTRAÍDO' || extractedData.recipient === 'DESTINATÁRIO NÃO ENCONTRADO') {
            const fallbackName = `Bradesco_${extractedData.type}_Pagina_${extractedData.pageNumber}.pdf`;


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




        // Analisar linhas
        const lines = text.split('\n').filter(line => line.trim());



        lines.slice(0, 20).forEach((line, index) => {

        });

        // Procurar por palavras-chave do Bradesco
        const keywords = ['BRADESCO', 'BANCO', 'TRANSAÇÃO', 'VALOR', 'BENEFICIÁRIO', 'RAZÃO', 'SOCIAL'];

        keywords.forEach(keyword => {
            const count = (text.toUpperCase().match(new RegExp(keyword, 'g')) || []).length;
            if (count > 0) {

            }
        });

        // Procurar padrões de valor
        const possibleValues = text.match(/[\d]{1,3}(?:\.[\d]{3})*,[\d]{2}/g);
        if (possibleValues) {

        }

        // Procurar nomes em maiúscula
        const upperCaseWords = text.match(/[A-Z]{3,}(?:\s+[A-Z]{2,})*/g);
        if (upperCaseWords) {

        }

        console.groupEnd();
    }
}

// Registrar template globalmente
if (typeof window !== 'undefined') {
    window.BradescoTemplate = BradescoTemplate;


}
