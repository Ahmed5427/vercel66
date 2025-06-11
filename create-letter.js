// Letter Creation Management
class LetterCreator {
    constructor() {
        this.sheetsAPI = new SheetsAPI();
        this.selectedTemplate = null;
        this.generatedLetter = '';
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
    }

    async loadSettings() {
        try {
            LoadingManager.show('جاري تحميل الإعدادات...');
            const settings = await this.sheetsAPI.getSettings();
            
            if (settings) {
                this.populateDropdowns(settings);
            } else {
                NotificationManager.show('لم يتم العثور على إعدادات الخطابات', 'error');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            NotificationManager.show('خطأ في تحميل الإعدادات', 'error');
        } finally {
            LoadingManager.hide();
        }
    }

    populateDropdowns(settings) {
        // Populate letter types
        const letterTypeSelect = document.getElementById('letterType');
        settings.letterTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            letterTypeSelect.appendChild(option);
        });

        // Populate purposes
        const purposeSelect = document.getElementById('letterPurpose');
        settings.purposes.forEach(purpose => {
            const option = document.createElement('option');
            option.value = purpose;
            option.textContent = purpose;
            purposeSelect.appendChild(option);
        });

        // Populate styles
        const styleSelect = document.getElementById('letterStyle');
        settings.styles.forEach(style => {
            const option = document.createElement('option');
            option.value = style;
            option.textContent = style;
            styleSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        // Form submission
        const letterForm = document.getElementById('letterForm');
        if (letterForm) {
            letterForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Template selection
        const templateCards = document.querySelectorAll('.template-card');
        templateCards.forEach(card => {
            card.addEventListener('click', () => this.selectTemplate(card));
        });

        // Template radio buttons
        const templateRadios = document.querySelectorAll('input[name="template"]');
        templateRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleTemplateChange());
        });

        // Save button
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAndProceed());
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const letterData = {
            category: formData.get('letterType'),
            sub_category: formData.get('letterPurpose'),
            title: formData.get('letterTitle'),
            recipient: formData.get('recipient'),
            isFirst: formData.get('isFirst') === 'true',
            prompt: formData.get('letterContent'),
            tone: formData.get('letterStyle')
        };

        try {
            LoadingManager.show('جاري إنشاء الخطاب...');
            const response = await this.generateLetter(letterData);
            
            if (response && response.letter) {
                this.generatedLetter = response.letter;
                this.displayGeneratedLetter(response.letter);
                this.showPreviewSection();
                NotificationManager.show('تم إنشاء الخطاب بنجاح', 'success');
            } else {
                throw new Error('لم يتم استلام الخطاب من الخادم');
            }
        } catch (error) {
            console.error('Error generating letter:', error);
            NotificationManager.show('خطأ في إنشاء الخطاب', 'error');
        } finally {
            LoadingManager.hide();
        }
    }

    async generateLetter(letterData) {
        // Use relative URL to call Vercel function
        const response = await fetch('/api/generate-letter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(letterData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    displayGeneratedLetter(letter) {
        const letterTextarea = document.getElementById('generatedLetter');
        if (letterTextarea) {
            letterTextarea.value = letter;
        }
    }

    showPreviewSection() {
        const previewSection = document.getElementById('previewSection');
        if (previewSection) {
            previewSection.style.display = 'block';
            previewSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    selectTemplate(card) {
        // Remove previous selection
        document.querySelectorAll('.template-card').forEach(c => {
            c.classList.remove('selected');
        });

        // Add selection to clicked card
        card.classList.add('selected');
        
        // Check the corresponding radio button
        const radio = card.querySelector('input[type="radio"]');
        if (radio) {
            radio.checked = true;
            this.selectedTemplate = radio.value;
            this.handleTemplateChange();
        }
    }

    handleTemplateChange() {
        const selectedRadio = document.querySelector('input[name="template"]:checked');
        if (selectedRadio) {
            this.selectedTemplate = selectedRadio.value;
            
            // Enable save button
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
            }
        }
    }

    async saveAndProceed() {
        if (!this.selectedTemplate) {
            NotificationManager.show('يرجى اختيار قالب للخطاب', 'warning');
            return;
        }

        const letterTextarea = document.getElementById('generatedLetter');
        const currentLetterContent = letterTextarea ? letterTextarea.value : this.generatedLetter;

        if (!currentLetterContent) {
            NotificationManager.show('لا يوجد محتوى للخطاب', 'error');
            return;
        }

        try {
            LoadingManager.show('جاري حفظ الخطاب...');
            
            // Get form data for archiving
            const formData = new FormData(document.getElementById('letterForm'));
            
            const archiveData = {
                letter_content: currentLetterContent,
                letter_type: formData.get('letterType'),
                recipient: formData.get('recipient'),
                title: formData.get('letterTitle'),
                is_first: formData.get('isFirst'),
                ID: this.generateUniqueId()
            };

            const response = await this.archiveLetter(archiveData);
            
            if (response) {
                NotificationManager.show('تم حفظ الخطاب بنجاح', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                throw new Error('فشل في حفظ الخطاب');
            }
        } catch (error) {
            console.error('Error saving letter:', error);
            NotificationManager.show('خطأ في حفظ الخطاب', 'error');
        } finally {
            LoadingManager.hide();
        }
    }

    async archiveLetter(archiveData) {
        // Use relative URL to call Vercel function
        const response = await fetch('/api/archive-letter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(archiveData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    generateUniqueId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LetterCreator();
});