# Renomeação de PDFs - Múltiplos Arquivos

## Nova Funcionalidade: Processamento de Múltiplos Arquivos PDF

O sistema agora suporta o upload e processamento simultâneo de vários arquivos PDF para renomeação automática baseada em dados extraídos.

### Como Usar

#### 1. Upload de Múltiplos Arquivos
- Navegue até a aba "Renomear"
- Faça upload de um ou mais arquivos PDF simultaneamente
- O sistema detectará automaticamente todos os PDFs

#### 2. Configuração
- Selecione o layout apropriado:
  - **Itaú**: Para comprovantes PIX, Boletos e TEDs do Itaú
  - **Bradesco**: Para transferências e boletos do Bradesco
- O sistema está pronto para processar vários arquivos com o mesmo layout

#### 3. Análise
- Clique em "Analisar Arquivos"
- O sistema processará todos os arquivos carregados
- Mostrará um preview organizado por arquivo
- Exibirá estatísticas de sucesso por arquivo

#### 4. Processamento
- Clique em "Processar e Renomear Todos"
- Cada página de cada arquivo será processada individualmente
- Os arquivos resultantes serão nomeados com base nos dados extraídos

#### 5. Download
- Baixe arquivos individuais ou use "Baixar Todos"
- Os downloads são organizados por arquivo original
- Tempo de download escalonado para evitar sobrecarga

### Recursos Principais

#### 🚀 Processamento Simultâneo
- Suporte para múltiplos arquivos PDF
- Processamento página por página
- Progresso detalhado em tempo real

#### 📊 Interface Organizada
- Preview agrupado por arquivo original
- Estatísticas de sucesso por arquivo
- Indicadores visuais de progresso

#### 🎯 Extração Inteligente
- Mesma qualidade de extração para todos os arquivos
- Templates específicos por banco
- Validação robusta de dados

#### 📁 Organização de Resultados
- Resultados agrupados por arquivo original
- Download organizado e escalonado
- Nomenclatura automática baseada em dados extraídos

### Exemplo de Uso

1. **Upload**: Carregue 5 arquivos PDF do Bradesco
2. **Configuração**: Selecione "Extratos Bradesco"
3. **Análise**: Sistema processa ~50 páginas total
4. **Resultado**: 50 arquivos individuais renomeados
5. **Download**: Baixe todos ou individualmente

### Formato de Nomenclatura

**Itaú**: `[Nome do Destinatário] valor R$ [Valor].pdf`
- Exemplo: `GOODYEAR DO BRASIL valor R$ 27.296,82.pdf`

**Bradesco**: `[Razão Social/Beneficiário] valor R$ [Valor Total].pdf`
- Exemplo: `TAURUS DIST DE PETROLEO LTDA valor R$ 130.600,00.pdf`

### Melhorias de Performance

- **Processamento Otimizado**: Análise paralela quando possível
- **Interface Responsiva**: Progress bars detalhadas
- **Gestão de Memória**: Limpeza automática de recursos
- **Downloads Escalonados**: Evita sobrecarga do browser

### Benefícios

1. **Eficiência**: Processe dezenas de arquivos de uma só vez
2. **Organização**: Mantenha controle sobre o progresso
3. **Qualidade**: Mesma precisão de extração para todos os arquivos
4. **Flexibilidade**: Baixe individual ou em lote

---

**Nota**: O sistema mantém compatibilidade total com processamento de arquivo único. A funcionalidade de múltiplos arquivos é uma extensão que não afeta o uso tradicional.
