// PDF Watermark Module
class PDFWatermarker {
    constructor() {
        this.initializeWatermarkFeatures();
    }

    initializeWatermarkFeatures() {
        this.setupEventListeners();
        this.loadWatermarkSettings();
    }

    setupEventListeners() {
        const watermarkBtn = document.getElementById('add-watermark');
        const previewBtn = document.getElementById('preview-watermark');
        const resetBtn = document.getElementById('reset-watermark-settings');

        if (watermarkBtn) {
            watermarkBtn.addEventListener('click', () => this.addWatermarkToPDFs());
        }

        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewWatermark());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetWatermarkSettings());
        }

        // Atualizar preview quando configurações mudarem
        this.setupPreviewUpdates();
    }

    setupPreviewUpdates() {
        const inputs = [
            'watermark-text',
            'watermark-size',
            'watermark-opacity',
            'watermark-rotation',
            'watermark-color'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateWatermarkPreview());
            }
        });

        const positionRadios = document.querySelectorAll('input[name="watermark-position"]');
        positionRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateWatermarkPreview());
        });
    }

    updateWatermarkPreview() {
        const previewContainer = document.getElementById('watermark-preview');
        if (!previewContainer) return;

        const settings = this.getWatermarkSettings();

        if (!settings.text.trim()) {
            previewContainer.innerHTML = '<p class="no-preview">Digite um texto para ver a prévia</p>';
            return;
        }

        previewContainer.innerHTML = `
            <div class="watermark-preview-container">
                <div class="preview-page">
                    <div class="watermark-sample" style="
                        font-size: ${settings.size}px;
                        opacity: ${settings.opacity};
                        color: ${settings.color};
                        transform: rotate(${settings.rotation}deg);
                        ${this.getPositionStyles(settings.position)}
                    ">
                        ${settings.text}
                    </div>
                    <div class="preview-content">
                        <p>Conteúdo do PDF</p>
                        <p>Lorem ipsum dolor sit amet...</p>
                    </div>
                </div>
            </div>
        `;
    }

    getPositionStyles(position) {
        const positions = {
            'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(var(--rotation));',
            'top-left': 'top: 20px; left: 20px;',
            'top-right': 'top: 20px; right: 20px;',
            'bottom-left': 'bottom: 20px; left: 20px;',
            'bottom-right': 'bottom: 20px; right: 20px;',
            'top-center': 'top: 20px; left: 50%; transform: translateX(-50%) rotate(var(--rotation));',
            'bottom-center': 'bottom: 20px; left: 50%; transform: translateX(-50%) rotate(var(--rotation));'
        };

        return positions[position] || positions['center'];
    }

    getWatermarkSettings() {
        return {
            text: document.getElementById('watermark-text')?.value || '',
            size: parseInt(document.getElementById('watermark-size')?.value || '48'),
            opacity: parseFloat(document.getElementById('watermark-opacity')?.value || '0.3'),
            rotation: parseInt(document.getElementById('watermark-rotation')?.value || '45'),
            color: document.getElementById('watermark-color')?.value || '#cccccc',
            position: document.querySelector('input[name="watermark-position"]:checked')?.value || 'center'
        };
    }

    async addWatermarkToPDFs() {
        const files = CORE.getUploadedFiles().filter(file => file.type === 'application/pdf');

        if (files.length === 0) {
            UI.showToast('Nenhum arquivo PDF carregado', 'warning');
            return;
        }

        const settings = this.getWatermarkSettings();

        if (!settings.text.trim()) {
            UI.showToast('Por favor, digite o texto da marca d\'água', 'warning');
            return;
        }

        UI.showProgress(0, 'Iniciando adição de marca d\'água...');

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progress = ((i + 1) / files.length) * 100;

                UI.showProgress(progress, `Adicionando marca d'água em ${file.name}...`);

                await this.processSinglePDFWatermark(file, settings);

                UI.addLog(`Marca d'água adicionada: ${file.name}`);

                // Pequena pausa para não sobrecarregar
                await this.sleep(200);
            }

            UI.hideProgress();
            UI.showToast(`Marca d'água adicionada em ${files.length} arquivo(s)`, 'success');

        } catch (error) {
            console.error('Erro ao adicionar marca d\'água:', error);
            UI.hideProgress();
            UI.showToast('Erro durante a adição da marca d\'água', 'error');
        }
    }

    async processSinglePDFWatermark(file, settings) {
        try {
            // Carregar o PDF usando PDF-lib
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            UI.addLog(`PDF carregado: ${file.name} (${totalPages} páginas)`);

            // Registrar fonte personalizada se necessário
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

            // Aplicar marca d'água em todas as páginas
            const pages = pdfDoc.getPages();

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();

                // Calcular posição da marca d'água
                const position = this.calculateWatermarkPosition(settings.position, width, height, settings);

                // Adicionar texto da marca d'água
                page.drawText(settings.text, {
                    x: position.x,
                    y: position.y,
                    size: settings.size,
                    font: font,
                    color: PDFLib.rgb(...this.hexToRgb(settings.color)),
                    opacity: settings.opacity,
                    rotate: PDFLib.degrees(settings.rotation)
                });
            }

            // Gerar o PDF final
            const pdfBytes = await pdfDoc.save();

            // Gerar nome do arquivo com marca d'água
            const watermarkedFileName = `${file.name.replace('.pdf', '')}_marca_dagua.pdf`;

            // Fazer download
            this.downloadPDF(pdfBytes, watermarkedFileName);

            UI.addLog(`PDF com marca d'água criado: ${watermarkedFileName}`);

        } catch (error) {
            console.error(`Erro ao processar ${file.name}:`, error);
            throw error;
        }
    }

    calculateWatermarkPosition(position, pageWidth, pageHeight, settings) {
        const margin = 50;

        switch (position) {
            case 'center':
                return {
                    x: pageWidth / 2,
                    y: pageHeight / 2
                };
            case 'top-left':
                return {
                    x: margin,
                    y: pageHeight - margin - settings.size
                };
            case 'top-right':
                return {
                    x: pageWidth - margin - (settings.text.length * settings.size * 0.6),
                    y: pageHeight - margin - settings.size
                };
            case 'bottom-left':
                return {
                    x: margin,
                    y: margin
                };
            case 'bottom-right':
                return {
                    x: pageWidth - margin - (settings.text.length * settings.size * 0.6),
                    y: margin
                };
            case 'top-center':
                return {
                    x: pageWidth / 2 - (settings.text.length * settings.size * 0.3),
                    y: pageHeight - margin - settings.size
                };
            case 'bottom-center':
                return {
                    x: pageWidth / 2 - (settings.text.length * settings.size * 0.3),
                    y: margin
                };
            default:
                return {
                    x: pageWidth / 2,
                    y: pageHeight / 2
                };
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [0.8, 0.8, 0.8]; // Cor padrão cinza claro
    }

    downloadPDF(pdfBytes, fileName) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    previewWatermark() {
        this.updateWatermarkPreview();

        const settings = this.getWatermarkSettings();
        UI.showToast(`Prévia atualizada: "${settings.text}" (${settings.size}px, ${Math.round(settings.opacity * 100)}% opacidade)`, 'info');
    }

    resetWatermarkSettings() {
        document.getElementById('watermark-text').value = '';
        document.getElementById('watermark-size').value = '48';
        document.getElementById('watermark-opacity').value = '0.3';
        document.getElementById('watermark-rotation').value = '45';
        document.getElementById('watermark-color').value = '#cccccc';

        const centerRadio = document.querySelector('input[name="watermark-position"][value="center"]');
        if (centerRadio) {
            centerRadio.checked = true;
        }

        this.updateWatermarkPreview();
        UI.showToast('Configurações de marca d\'água resetadas', 'info');
    }

    loadWatermarkSettings() {
        // Carregar configurações salvas do localStorage
        const savedSettings = localStorage.getItem('pdfProcessor_watermarkSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);

                if (settings.text) document.getElementById('watermark-text').value = settings.text;
                if (settings.size) document.getElementById('watermark-size').value = settings.size;
                if (settings.opacity) document.getElementById('watermark-opacity').value = settings.opacity;
                if (settings.rotation) document.getElementById('watermark-rotation').value = settings.rotation;
                if (settings.color) document.getElementById('watermark-color').value = settings.color;

                if (settings.position) {
                    const positionRadio = document.querySelector(`input[name="watermark-position"][value="${settings.position}"]`);
                    if (positionRadio) {
                        positionRadio.checked = true;
                    }
                }

                this.updateWatermarkPreview();
            } catch (error) {
                console.error('Erro ao carregar configurações salvas:', error);
            }
        }
    }

    saveWatermarkSettings() {
        // Salvar configurações no localStorage
        const settings = this.getWatermarkSettings();
        localStorage.setItem('pdfProcessor_watermarkSettings', JSON.stringify(settings));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Método para aplicar marca d'água em lote com configurações diferentes
    async batchWatermark(files, watermarkConfigs) {
        UI.showProgress(0, 'Iniciando processamento em lote...');

        try {
            let processedCount = 0;
            const total = files.length * watermarkConfigs.length;

            for (const config of watermarkConfigs) {
                for (const file of files) {
                    await this.processSinglePDFWatermark(file, config);
                    processedCount++;

                    const progress = (processedCount / total) * 100;
                    UI.showProgress(progress, `Processando com configuração "${config.text}"...`);
                }
            }

            UI.hideProgress();
            UI.showToast(`Processamento em lote concluído! ${processedCount} arquivo(s) criado(s)`, 'success');

        } catch (error) {
            console.error('Erro no processamento em lote:', error);
            UI.hideProgress();
            UI.showToast('Erro durante o processamento em lote', 'error');
        }
    }
}

// Inicializar quando o DOM estiver pronto
let pdfWatermarker;
document.addEventListener('DOMContentLoaded', () => {
    pdfWatermarker = new PDFWatermarker();
});

// Salvar configurações antes de sair da página
window.addEventListener('beforeunload', () => {
    if (pdfWatermarker) {
        pdfWatermarker.saveWatermarkSettings();
    }
});
