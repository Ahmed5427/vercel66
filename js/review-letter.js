// Letter Review Management
class LetterReviewer {
    constructor() {
        this.sheetsAPI = new SheetsAPI();
        this.selectedLetter = null;
        this.init();
    }

    async init() {
        await this.loadLetters();
        this.setupEventListeners();
    }

    async loadLetters() {
        try {
            LoadingManager.show('جاري تحميل الخطابات...');
            const submissions = await this.sheetsAPI.getSubmissions();
            this.populateLettersDropdown(submissions);
        } catch (error) {
            console.error('Error loading letters:', error);
            NotificationManager.show('خطأ في تحميل الخطابات', 'error');
        } finally {
            LoadingManager.hide();
        }
    }

    populateLettersDropdown(submissions) {
        const letterSelect = document.getElementById('letterSelect');
        if (!letterSelect) return;

        // Clear existing options
        letterSelect.innerHTML = '<option value="">اختر خطاباً</option>';

        submissions.forEach((submission, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${submission['الرقم المرجعي'] || submission.ID || `خطاب ${index + 1}`} - ${submission['الموضوع'] || submission.title || 'بدون عنوان'}`;
            option.dataset.submission = JSON.stringify(submission);
            letterSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        // Letter selection
        const letterSelect = document.getElementById('letterSelect');
        if (letterSelect) {
            letterSelect.addEventListener('change', () => this.handleLetterSelection());
        }

        // Select letter button
        const selectLetterBtn = document.getElementById('selectLetterBtn');
        if (selectLetterBtn) {
            selectLetterBtn.addEventListener('click', () => this.displaySelectedLetter());
        }

        // Review completed checkbox
        const reviewCompleted = document.getElementById('reviewCompleted');
        if (reviewCompleted) {
            reviewCompleted.addEventListener('change', () => this.handleReviewCompletedChange());
        }

        // Review action buttons
        const needsImprovementBtn = document.getElementById('needsImprovementBtn');
        const readyToSendBtn = document.getElementById('readyToSendBtn');
        const rejectedBtn = document.getElementById('rejectedBtn');

        if (needsImprovementBtn) {
            needsImprovementBtn.addEventListener('click', () => this.submitReview('يحتاج إلى تحسينات'));
        }

        if (readyToSendBtn) {
            readyToSendBtn.addEventListener('click', () => this.submitReview('جاهز للإرسال'));
        }

        if (rejectedBtn) {
            rejectedBtn.addEventListener('click', () => this.submitReview('مرفوض'));
        }
    }

    handleLetterSelection() {
        const letterSelect = document.getElementById('letterSelect');
        const selectLetterBtn = document.getElementById('selectLetterBtn');
        
        if (letterSelect && selectLetterBtn) {
            selectLetterBtn.disabled = !letterSelect.value;
        }
    }

    displaySelectedLetter() {
        const letterSelect = document.getElementById('letterSelect');
        if (!letterSelect || !letterSelect.value) return;

        const selectedOption = letterSelect.options[letterSelect.selectedIndex];
        this.selectedLetter = JSON.parse(selectedOption.dataset.submission);

        // Display letter content
        const letterText = document.getElementById('letterText');
        if (letterText) {
            letterText.value = this.selectedLetter['محتوى الخطاب'] || this.selectedLetter.letter_content || '';
        }

        // Show review section
        const reviewSection = document.getElementById('reviewSection');
        if (reviewSection) {
            reviewSection.style.display = 'block';
            reviewSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Reset form
        this.resetReviewForm();
    }

    resetReviewForm() {
        const reviewerName = document.getElementById('reviewerName');
        const reviewNotes = document.getElementById('reviewNotes');
        const reviewCompleted = document.getElementById('reviewCompleted');

        if (reviewerName) reviewerName.value = '';
        if (reviewNotes) reviewNotes.value = '';
        if (reviewCompleted) reviewCompleted.checked = false;

        this.handleReviewCompletedChange();
    }

    handleReviewCompletedChange() {
        const reviewCompleted = document.getElementById('reviewCompleted');
        const actionButtons = [
            document.getElementById('needsImprovementBtn'),
            document.getElementById('readyToSendBtn'),
            document.getElementById('rejectedBtn')
        ];

        const isCompleted = reviewCompleted && reviewCompleted.checked;
        
        actionButtons.forEach(btn => {
            if (btn) {
                btn.disabled = !isCompleted;
            }
        });
    }

    async submitReview(status) {
        const reviewerName = document.getElementById('reviewerName');
        const letterText = document.getElementById('letterText');
        const reviewNotes = document.getElementById('reviewNotes');

        if (!reviewerName || !reviewerName.value.trim()) {
            NotificationManager.show('يرجى إدخال اسم المراجع', 'warning');
            return;
        }

        const reviewData = {
            letterId: this.selectedLetter['الرقم المرجعي'] || this.selectedLetter.ID,
            reviewerName: reviewerName.value.trim(),
            updatedContent: letterText ? letterText.value : '',
            notes: reviewNotes ? reviewNotes.value.trim() : '',
            status: status,
            reviewDate: new Date().toISOString().split('T')[0]
        };

        try {
            LoadingManager.show('جاري تحديث حالة المراجعة...');
            
            // Here you would typically update the Google Sheets
            // For now, we'll simulate the API call
            await this.updateReviewStatus(reviewData);
            
            NotificationManager.show(`تم تحديث حالة الخطاب إلى: ${status}`, 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } catch (error) {
            console.error('Error updating review status:', error);
            NotificationManager.show('خطأ في تحديث حالة المراجعة', 'error');
        } finally {
            LoadingManager.hide();
        }
    }

    async updateReviewStatus(reviewData) {
        // This would typically call a backend API to update the Google Sheets
        // Since we can't directly update Google Sheets from the frontend with just an API key,
        // you would need a backend service for this functionality
        
        console.log('Review data to be updated:', reviewData);
        
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LetterReviewer();
});