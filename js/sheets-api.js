// Google Sheets API Configuration
const SHEET_CONFIG = {
    spreadsheetId: '1cLbTgbluZyWYHRouEgqHQuYQqKexHhu4st9ANzuaxGk',
    apiKey: 'AIzaSyBqF-nMxyZMrjmdFbULO9I_j75hXXaiq4A',
    baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets'
};

// Google Sheets API Client
class SheetsAPI {
    constructor() {
        this.baseUrl = `${SHEET_CONFIG.baseUrl}/${SHEET_CONFIG.spreadsheetId}/values`;
    }

    async getSheetData(sheetName, range = '') {
        try {
            const fullRange = range ? `${sheetName}!${range}` : sheetName;
            const url = `${this.baseUrl}/${fullRange}?key=${SHEET_CONFIG.apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.values || [];
        } catch (error) {
            console.error('Error fetching sheet data:', error);
            throw error;
        }
    }

    async getSettings() {
        try {
            const data = await this.getSheetData('Settings');
            if (data.length === 0) return null;

            const headers = data[0];
            const rows = data.slice(1);
            
            return {
                letterTypes: this.extractColumnValues(rows, headers, 'B'),
                purposes: this.extractColumnValues(rows, headers, 'C'),
                styles: this.extractColumnValues(rows, headers, 'G')
            };
        } catch (error) {
            console.error('Error getting settings:', error);
            return null;
        }
    }

    async getSubmissions() {
        try {
            const data = await this.getSheetData('Submissions');
            if (data.length === 0) return [];

            const headers = data[0];
            const rows = data.slice(1);
            
            return rows.map(row => {
                const submission = {};
                headers.forEach((header, index) => {
                    submission[header] = row[index] || '';
                });
                return submission;
            });
        } catch (error) {
            console.error('Error getting submissions:', error);
            return [];
        }
    }

    extractColumnValues(rows, headers, column) {
        const columnIndex = this.getColumnIndex(column);
        const values = rows.map(row => row[columnIndex]).filter(value => value && value.trim());
        return [...new Set(values)]; // Remove duplicates
    }

    getColumnIndex(column) {
        // Convert column letter to index (A=0, B=1, etc.)
        return column.charCodeAt(0) - 'A'.charCodeAt(0);
    }

    translateLetterType(type) {
        const translations = {
            'New': 'جديد',
            'Reply': 'رد',
            'Follow Up': 'متابعة',
            'Co-op': 'تعاون'
        };
        return translations[type] || type;
    }
}

// Export for use in other files
window.SheetsAPI = SheetsAPI;