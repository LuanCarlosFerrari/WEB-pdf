// Gerenciador de Templates para Extração de Dados
class TemplateManager {
    constructor() {
        this.templates = new Map();
        this.loadedTemplates = new Set();
        console.log('📋 TemplateManager inicializado');
        this.init();
    }

    async init() {
        // Registrar templates disponíveis
        this.registerTemplate('itau', {
            name: 'Banco Itaú',
            description: 'PIX, Boleto e TED do Itaú',
            scriptPath: 'js/templates/itau-template.js',
            className: 'ItauTemplate'
        });

        this.registerTemplate('bradesco', {
            name: 'Banco Bradesco',
            description: 'Transferência e Boleto do Bradesco',
            scriptPath: 'js/templates/bradesco-template.js',
            className: 'BradescoTemplate'
        });

        // Carregar o template padrão (Itaú)
        await this.loadTemplate('itau');

        // Log dos templates registrados
        console.log('📋 Templates registrados:', Array.from(this.templates.keys()));
        console.log('📋 Templates disponíveis:', this.getAvailableTemplates());
    }

    registerTemplate(key, config) {
        this.templates.set(key, config);
        console.log(`📋 Template registrado: ${key} - ${config.name}`);
    }

    async loadTemplate(templateKey) {
        if (!this.templates.has(templateKey)) {
            throw new Error(`Template não encontrado: ${templateKey}`);
        }

        if (this.loadedTemplates.has(templateKey)) {
            console.log(`📋 Template já carregado: ${templateKey}`);
            return this.getTemplateInstance(templateKey);
        }

        const config = this.templates.get(templateKey);

        try {
            // Carregar o script do template dinamicamente
            await this.loadScript(config.scriptPath);
            this.loadedTemplates.add(templateKey);

            console.log(`✅ Template carregado: ${templateKey}`);
            return this.getTemplateInstance(templateKey);

        } catch (error) {
            console.error(`❌ Erro ao carregar template ${templateKey}:`, error);
            throw error;
        }
    }

    getTemplateInstance(templateKey) {
        if (!this.templates.has(templateKey)) {
            throw new Error(`Template não encontrado: ${templateKey}`);
        }

        if (!this.loadedTemplates.has(templateKey)) {
            throw new Error(`Template não carregado: ${templateKey}`);
        }

        const config = this.templates.get(templateKey);
        const TemplateClass = window[config.className];

        if (!TemplateClass) {
            throw new Error(`Classe do template não encontrada: ${config.className}`);
        }

        return new TemplateClass();
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar se o script já foi carregado
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`));
            document.head.appendChild(script);
        });
    }

    getAvailableTemplates() {
        return Array.from(this.templates.entries()).map(([key, config]) => ({
            key,
            name: config.name,
            description: config.description,
            loaded: this.loadedTemplates.has(key)
        }));
    }

    async extractData(templateKey, text, pageNum) {
        try {
            const template = await this.loadTemplate(templateKey);
            return template.extractData(text, pageNum);
        } catch (error) {
            console.error(`❌ Erro na extração de dados:`, error);
            return {
                pageNumber: pageNum,
                recipient: 'Erro na extração',
                value: '0,00',
                type: 'Erro',
                rawText: text.substring(0, 200) + '...',
                success: false,
                error: error.message
            };
        }
    }

    // Métodos de utilitário para UI
    async getTypeIcon(templateKey, type) {
        try {
            const template = await this.loadTemplate(templateKey);
            return template.getTypeIcon ? template.getTypeIcon(type) : 'fas fa-file';
        } catch (error) {
            return 'fas fa-file';
        }
    }

    async getTypeColor(templateKey, type) {
        try {
            const template = await this.loadTemplate(templateKey);
            return template.getTypeColor ? template.getTypeColor(type) : 'bg-gray-100 text-gray-800';
        } catch (error) {
            return 'bg-gray-100 text-gray-800';
        }
    }
}

// Instância global
window.TemplateManager = TemplateManager;
