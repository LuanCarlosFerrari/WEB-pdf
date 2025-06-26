// PDF Renaming Module
class PDFRenamer {
    constructor() {
        this.rules = [];
        this.initializeRenameFeatures();
    }

    initializeRenameFeatures() {
        this.setupEventListeners();
        this.loadRenameRules();
    }

    setupEventListeners() {
        const addRuleBtn = document.getElementById('add-rename-rule');
        const clearRulesBtn = document.getElementById('clear-rename-rules');
        const processFilesBtn = document.getElementById('process-rename-files');

        if (addRuleBtn) {
            addRuleBtn.addEventListener('click', () => this.addRenameRule());
        }

        if (clearRulesBtn) {
            clearRulesBtn.addEventListener('click', () => this.clearRenameRules());
        }

        if (processFilesBtn) {
            processFilesBtn.addEventListener('click', () => this.processRenameFiles());
        }
    }

    addRenameRule() {
        const find = document.getElementById('rename-find')?.value || '';
        const replace = document.getElementById('rename-replace')?.value || '';

        if (!find.trim()) {
            UI.showToast('Por favor, digite o texto a ser encontrado', 'warning');
            return;
        }

        const rule = {
            find: find,
            replace: replace,
            id: Date.now()
        };

        this.rules.push(rule);
        this.updateRulesDisplay();
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
        if (!container) return;

        if (this.rules.length === 0) {
            container.innerHTML = '<p class="no-rules">Nenhuma regra adicionada</p>';
            return;
        }

        container.innerHTML = this.rules.map(rule => `
            <div class="rename-rule" data-id="${rule.id}">
                <div class="rule-content">
                    <span class="rule-find">"${rule.find}"</span>
                    <span class="rule-arrow">→</span>
                    <span class="rule-replace">"${rule.replace}"</span>
                </div>
                <button class="remove-rule" onclick="pdfRenamer.removeRule(${rule.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeRule(ruleId) {
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
        this.updateRulesDisplay();
        UI.showToast('Regra removida', 'info');
    }

    clearRuleInputs() {
        const findInput = document.getElementById('rename-find');
        const replaceInput = document.getElementById('rename-replace');

        if (findInput) findInput.value = '';
        if (replaceInput) replaceInput.value = '';
    }

    async processRenameFiles() {
        const files = CORE.getUploadedFiles();

        if (files.length === 0) {
            UI.showToast('Nenhum arquivo carregado', 'warning');
            return;
        }

        if (this.rules.length === 0) {
            UI.showToast('Nenhuma regra de renomeação configurada', 'warning');
            return;
        }

        UI.showProgress(0, 'Iniciando processo de renomeação...');

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progress = ((i + 1) / files.length) * 100;

                UI.showProgress(progress, `Processando ${file.name}...`);

                // Aplicar regras de renomeação
                let newName = file.name;

                this.rules.forEach(rule => {
                    if (rule.find) {
                        newName = newName.replace(new RegExp(rule.find, 'g'), rule.replace);
                    }
                });

                // Se o nome mudou, criar arquivo renomeado
                if (newName !== file.name) {
                    await this.downloadRenamedFile(file, newName);
                    UI.addLog(`Arquivo renomeado: ${file.name} → ${newName}`);
                } else {
                    UI.addLog(`Nenhuma alteração necessária: ${file.name}`);
                }

                // Pequena pausa para não sobrecarregar
                await this.sleep(100);
            }

            UI.hideProgress();
            UI.showToast(`Processo concluído! ${files.length} arquivo(s) processado(s)`, 'success');

        } catch (error) {
            console.error('Erro no processo de renomeação:', error);
            UI.hideProgress();
            UI.showToast('Erro durante o processo de renomeação', 'error');
        }
    }

    async downloadRenamedFile(file, newName) {
        // Para arquivos PDF, vamos apenas renomear e fazer download
        // Para outros tipos de arquivo, faremos o mesmo

        try {
            // Criar um novo arquivo com o nome alterado
            const blob = new Blob([file], { type: file.type });

            // Fazer download com o novo nome
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = newName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error('Erro ao renomear arquivo:', error);
            throw error;
        }
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
}

// Inicializar quando o DOM estiver pronto
let pdfRenamer;
document.addEventListener('DOMContentLoaded', () => {
    pdfRenamer = new PDFRenamer();
});

// Salvar regras antes de sair da página
window.addEventListener('beforeunload', () => {
    if (pdfRenamer) {
        pdfRenamer.saveRenameRules();
    }
});
