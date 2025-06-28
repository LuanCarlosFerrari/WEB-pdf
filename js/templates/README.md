# Sistema de Templates para Extração de Dados PDF

Este documento descreve o sistema modular de templates implementado para extrair dados de comprovantes bancários e gerar nomes de arquivos automaticamente.

## 📁 Estrutura de Arquivos

```
js/
├── templates/
│   ├── template-manager.js     # Gerenciador de templates
│   ├── itau-template.js        # Template específico do Itaú
│   └── README.md              # Este arquivo
├── rename.js                  # Módulo principal de renomeação
└── ...
```

## 🏗️ Arquitetura

### Template Manager (`template-manager.js`)
- Gerencia o carregamento dinâmico de templates
- Registra e instancia templates conforme necessário
- Fornece interface unificada para extração de dados

### Templates Específicos
Cada banco tem seu próprio template com:
- Detecção de tipos de documentos
- Padrões regex específicos para extração
- Formatação de nomes e valores
- Configuração de ícones e cores para UI

## 🏦 Template Itaú (`itau-template.js`)

### Tipos Suportados:
- **PIX**: Transferências PIX
- **Boleto**: Pagamentos de boleto
- **TED**: Transferências TED

### Padrão de Nomenclatura:
```
[Nome do Destinatário] valor R$ [Valor].pdf
```

### Exemplo:
```
GOODYEAR DO BRASIL valor R$ 27.296,82.pdf
```

## 🔧 Como Adicionar um Novo Banco

### 1. Criar o Template
Crie um arquivo `js/templates/[banco]-template.js`:

```javascript
class [Banco]Template {
    constructor() {
        this.bankName = '[Nome do Banco]';
        this.supportedTypes = ['Tipo1', 'Tipo2'];
    }

    extractData(text, pageNum) {
        // Implementar lógica de extração
        return {
            pageNumber: pageNum,
            recipient: 'Nome extraído',
            value: '0,00',
            type: 'Tipo detectado',
            success: true,
            bank: this.bankName
        };
    }

    detectDocumentType(text) {
        // Implementar detecção de tipo
    }

    // Métodos específicos para cada tipo...
}

window.[Banco]Template = [Banco]Template;
```

### 2. Registrar no Manager
No `template-manager.js`, adicione:

```javascript
this.registerTemplate('[banco]', {
    name: '[Nome do Banco]',
    description: 'Descrição dos tipos suportados',
    scriptPath: 'js/templates/[banco]-template.js',
    className: '[Banco]Template'
});
```

### 3. Atualizar a Interface
No `index_modular.html`, adicione a opção no select:

```html
<option value="[banco]">[Nome do Banco] - Tipos Suportados</option>
```

## 📊 Estrutura de Dados

### Resultado da Extração:
```javascript
{
    pageNumber: 1,              // Número da página
    recipient: 'Nome Empresa',  // Nome do destinatário/beneficiário
    value: '1.234,56',          // Valor formatado (R$ brasileiro)
    type: 'PIX',                // Tipo do documento
    rawText: 'Texto...',        // Texto original da página
    success: true,              // Se a extração foi bem-sucedida
    bank: 'Itaú'               // Nome do banco
}
```

## 🎨 UI Helpers

Cada template deve implementar:

```javascript
getTypeIcon(type) {
    // Retorna classe do ícone Font Awesome
    return 'fas fa-mobile-alt';
}

getTypeColor(type) {
    // Retorna classes Tailwind para cor
    return 'bg-blue-100 text-blue-800';
}
```

## 🔍 Padrões de Regex

### Estrutura Recomendada:
```javascript
const patterns = {
    recipient: /padrão para nome/i,
    value: /padrão para valor/i,
    // Padrões alternativos
    recipientAlt: /padrão alternativo/i,
    valueAlt: /padrão alternativo/i
};
```

### Dicas para Regex:
- Use grupos de captura `()` para extrair dados
- Considere variações de formato (maiúscula/minúscula)
- Implemente padrões alternativos para robustez
- Teste com documentos reais

## 🚀 Benefícios do Sistema Modular

### ✅ Vantagens:
- **Escalabilidade**: Fácil adição de novos bancos
- **Manutenibilidade**: Lógica isolada por banco
- **Reutilização**: Templates podem ser reutilizados
- **Flexibilidade**: Cada banco tem suas especificidades
- **Performance**: Carregamento dinâmico de templates

### 🔄 Processo de Extração:
1. Usuário seleciona layout do banco
2. Template Manager carrega o template específico
3. Template analisa texto e detecta tipo de documento
4. Dados são extraídos usando padrões específicos
5. Resultado é formatado e exibido na UI

## 📋 Próximos Passos

### Templates Planejados:
- **Bradesco**: PIX, Boleto, TED
- **Banco do Brasil**: PIX, Boleto, TED, DOC
- **Santander**: PIX, Boleto, TED
- **Caixa**: PIX, Boleto, TED
- **Nubank**: PIX, Boleto

### Melhorias Futuras:
- Sistema de configuração visual
- Editor de padrões regex
- Validação de templates
- Métricas de precisão
- Cache de templates carregados

---

## 💡 Contribuição

Para contribuir com novos templates:

1. Analise documentos reais do banco
2. Identifique padrões comuns
3. Implemente o template seguindo a estrutura
4. Teste com documentos variados
5. Documente padrões específicos

Este sistema foi projetado para ser extensível e fácil de manter, permitindo suporte rápido a novos bancos e tipos de documentos.
