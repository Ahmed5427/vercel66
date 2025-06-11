// Archive Letters Management
class ArchiveManager {
    constructor() {
        this.sheetsAPI = new SheetsAPI();
        this.allSubmissions = [];
        this.filteredSubmissions = [];
        this.init();
    }

    async init() {
        await this.loadSubmissions();
        this.setupEventListeners();
        this.renderTable();
    }

    async loadSubmissions() {
        try {
            LoadingManager.show('جاري تحميل سجل الخطابات...');
            this.allSubmissions = await this.sheetsAPI.getSubmissions();
            this.filteredSubmissions = [...this.allSubmissions];
        } catch (error) {
            console.error('Error loading submissions:', error);
            NotificationManager.show('خطأ في تحميل سجل الخطابات', 'error');
        } finally {
            LoadingManager.hide();
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleSearch());
        }

        // Filter dropdowns
        const letterTypeFilter = document.getElementById('letterTypeFilter');
        const reviewStatusFilter = document.getElementById('reviewStatusFilter');

        if (letterTypeFilter) {
            letterTypeFilter.addEventListener('change', () => this.applyFilters());
        }

        if (reviewStatusFilter) {
            reviewStatusFilter.addEventListener('change', () => this.applyFilters());
        }
    }

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

        if (!searchTerm) {
            this.filteredSubmissions = [...this.allSubmissions];
        } else {
            this.filteredSubmissions = this.allSubmissions.filter(submission => {
                                const recipient = (submission['المستلم'] || submission.recipient || '').toLowerCase();
                const refId = (submission['الرقم المرجعي'] || submission.ID || '').toLowerCase();
                
                return recipient.includes(searchTerm) || refId.includes(searchTerm);
            });
        }

        this.applyFilters();
    }

    applyFilters() {
        const letterTypeFilter = document.getElementById('letterTypeFilter');
        const reviewStatusFilter = document.getElementById('reviewStatusFilter');

        let filtered = [...this.filteredSubmissions];

        // Apply letter type filter
        if (letterTypeFilter && letterTypeFilter.value) {
            filtered = filtered.filter(submission => {
                const letterType = this.sheetsAPI.translateLetterType(submission['نوع الخطاب'] || submission.letter_type || '');
                return letterType === letterTypeFilter.value;
            });
        }

        // Apply review status filter
        if (reviewStatusFilter && reviewStatusFilter.value) {
            filtered = filtered.filter(submission => {
                const reviewStatus = submission['المراجعة'] || submission.review_status || 'في الانتظار';
                return reviewStatus === reviewStatusFilter.value;
            });
        }

        this.filteredSubmissions = filtered;
        this.renderTable();
    }

    renderTable() {
        const tableBody = document.getElementById('lettersTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (this.filteredSubmissions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="8" class="text-center">
                    <div style="padding: 2rem; color: var(--text-light);">
                        <i class="fas fa-inbox fa-2x"></i>
                        <p style="margin-top: 1rem;">لا توجد خطابات مطابقة للبحث</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
            return;
        }

        this.filteredSubmissions.forEach((submission, index) => {
            const row = this.createTableRow(submission, index);
            tableBody.appendChild(row);
        });
    }

    createTableRow(submission, index) {
        const row = document.createElement('tr');
        
        const refId = submission['الرقم المرجعي'] || submission.ID || `L${index + 1}`;
        const date = submission['التاريخ'] || submission.date || new Date().toLocaleDateString('ar-SA');
        const letterType = this.sheetsAPI.translateLetterType(submission['نوع الخطاب'] || submission.letter_type || 'New');
        const reviewStatus = submission['المراجعة'] || submission.review_status || 'في الانتظار';
        const sendStatus = submission['الإرسال'] || submission.send_status || 'في الانتظار';
        const recipient = submission['المستلم'] || submission.recipient || '';
        const subject = submission['الموضوع'] || submission.title || '';

        row.innerHTML = `
            <td>${refId}</td>
            <td>${date}</td>
            <td>${letterType}</td>
            <td>${this.createStatusBadge(reviewStatus, 'review')}</td>
            <td>${this.createStatusBadge(sendStatus, 'send')}</td>
            <td>${recipient}</td>
            <td>${subject}</td>
            <td>${this.createActionsCell(submission, index)}</td>
        `;

        return row;
    }

    createStatusBadge(status, type) {
        let className = 'status-badge ';
        
        if (type === 'review') {
            switch (status) {
                case 'جاهز للإرسال':
                    className += 'status-ready';
                    break;
                case 'يحتاج إلى تحسينات':
                    className += 'status-needs-improvement';
                    break;
                case 'مرفوض':
                    className += 'status-needs-improvement';
                    break;
                default:
                    className += 'status-waiting';
            }
        } else if (type === 'send') {
            switch (status) {
                case 'تم الإرسال':
                    className += 'status-sent';
                    break;
                default:
                    className += 'status-waiting';
            }
        }

        return `<span class="${className}">${status}</span>`;
    }

    createActionsCell(submission, index) {
        return `
            <div class="actions-group">
                <button class="action-btn" onclick="archiveManager.reviewLetter(${index})" title="مراجعة">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="archiveManager.printLetter(${index})" title="طباعة">
                    <i class="fas fa-print"></i>
                </button>
                <button class="action-btn" onclick="archiveManager.downloadLetter(${index})" title="تحميل">
                    <i class="fas fa-download"></i>
                </button>
                <button class="action-btn delete" onclick="archiveManager.deleteLetter(${index})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    reviewLetter(index) {
        const submission = this.filteredSubmissions[index];
        if (submission) {
            // Store the selected letter in sessionStorage for the review page
            sessionStorage.setItem('selectedLetterForReview', JSON.stringify(submission));
            window.location.href = 'review-letter.html';
        }
    }

    printLetter(index) {
        const submission = this.filteredSubmissions[index];
        if (submission) {
            const letterContent = submission['محتوى الخطاب'] || submission.letter_content || '';
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <title>طباعة الخطاب</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            margin: 2cm;
                            direction: rtl;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 2rem;
                        }
                        .letter-content {
                            white-space: pre-line;
                            text-align: justify;
                        }
                        @media print {
                            body { margin: 1cm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>${submission['الموضوع'] || submission.title || 'خطاب'}</h2>
                        <p>المرسل إليه: ${submission['المستلم'] || submission.recipient || ''}</p>
                    </div>
                    <div class="letter-content">${letterContent}</div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    }

    async downloadLetter(index) {
        const submission = this.filteredSubmissions[index];
        if (!submission) return;

        try {
            LoadingManager.show('جاري تحضير الملف...');
            
            const letterContent = submission['محتوى الخطاب'] || submission.letter_content || '';
            const fileName = `${submission['الموضوع'] || submission.title || 'خطاب'}.pdf`;
            
            // Create a simple text-based PDF using jsPDF (you'll need to include this library)
            // For now, we'll create a text file
            const blob = new Blob([letterContent], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName.replace('.pdf', '.txt');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            NotificationManager.show('تم تحميل الملف بنجاح', 'success');
        } catch (error) {
            console.error('Error downloading letter:', error);
            NotificationManager.show('خطأ في تحميل الملف', 'error');
        } finally {
            LoadingManager.hide();
        }
    }

    deleteLetter(index) {
        const submission = this.filteredSubmissions[index];
        if (!submission) return;

        const confirmDelete = confirm(`هل أنت متأكد من حذف الخطاب: ${submission['الموضوع'] || submission.title || 'خطاب'}؟`);
        
        if (confirmDelete) {
            // Remove from filtered array
            this.filteredSubmissions.splice(index, 1);
            
            // Remove from all submissions array
            const originalIndex = this.allSubmissions.findIndex(s => 
                (s['الرقم المرجعي'] || s.ID) === (submission['الرقم المرجعي'] || submission.ID)
            );
            
            if (originalIndex !== -1) {
                this.allSubmissions.splice(originalIndex, 1);
            }
            
            // Re-render table
            this.renderTable();
            
            NotificationManager.show('تم حذف الخطاب بنجاح', 'success');
            
            // Note: In a real application, you would also need to delete from the Google Sheets
            // This would require a backend API
        }
    }
}

// Create global instance for onclick handlers
let archiveManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    archiveManager = new ArchiveManager();
});