import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// Set worker source (required for Next.js/Browser)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface BankTransaction {
    date: Date;
    description: string;
    amount: number;
    type: 'expense' | 'income';
    balance: number;
    rawReference: string;

    // Extracted Fields
    paymentMode?: 'Cash' | 'UPI' | 'Card' | 'NetBanking';
    payeeName?: string; // Display Name for Payee/Payer
    transactionId?: string;
    senderName?: string;
    receiverName?: string;
}

export const parseBankStatement = async (file: File): Promise<BankTransaction[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let transactions: BankTransaction[] = [];

    // Loop through all pages
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items as TextItem[];
        const lines = reconstructLines(items);
        const pageTransactions = parseLines(lines);
        transactions = [...transactions, ...pageTransactions];
    }

    return transactions;
};

const reconstructLines = (items: TextItem[]): string[] => {
    // Group items by Y position
    const linesMap = new Map<number, { text: string, x: number }[]>();
    items.forEach(item => {
        const y = Math.round(item.transform[5]); // Y position
        if (!linesMap.has(y)) linesMap.set(y, []);
        linesMap.get(y)?.push({ text: item.str, x: item.transform[4] });
    });
    const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
    return sortedY.map(y => {
        const lineItems = linesMap.get(y) || [];
        lineItems.sort((a, b) => a.x - b.x);
        return lineItems.map(i => i.text).join(' ');
    });
};

const parseLines = (lines: string[]): BankTransaction[] => {
    const transactions: BankTransaction[] = [];
    const dateRegex = /^(\d{2}-\d{2}-\d{2})/;

    lines.forEach(line => {
        const match = line.match(dateRegex);
        if (!match) return;

        const parts = line.split(/\s+/).filter(Boolean);
        if (parts.length < 5) return;

        const dateStr = parts[0];
        const dateParts = dateStr.split('-');
        const fullDate = new Date(2000 + parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));

        // Determine Amount and Type
        let amount = 0;
        let type: 'expense' | 'income' = 'expense';

        const numbers = line.match(/(\d+\.\d{2})/g);
        if (!numbers || numbers.length < 1) return;

        // Logic: Check if it's DR or CR in reference
        if (line.includes('/DR/') || line.toUpperCase().includes('DEBIT')) {
            type = 'expense';
        } else if (line.includes('/CR/') || line.toUpperCase().includes('CREDIT')) {
            type = 'income';
        }

        if (numbers.length >= 2) {
            amount = parseFloat(numbers[numbers.length - 2]);
        } else {
            amount = parseFloat(numbers[0]);
        }

        const upiDetails = extractUpiDetails(line, type);

        transactions.push({
            date: fullDate,
            description: upiDetails.payeeName || extractDescription(line),
            amount,
            type,
            balance: 0,
            rawReference: line,
            ...upiDetails
        });
    });

    return transactions;
};

const extractDescription = (line: string): string => {
    let text = line.replace(/^\d{2}-\d{2}-\d{2}\s+/, '');
    text = text.replace(/[\d,]+\.\d{2}\s*[\d,]*\.\d{2}?.*$/, '');
    text = text.replace(/[\d,]+\.\d{2}.*$/, '');
    return text.trim();
};

const extractUpiDetails = (line: string, type: 'expense' | 'income') => {
    const result: {
        paymentMode?: 'Cash' | 'UPI' | 'Card' | 'NetBanking';
        payeeName?: string;
        transactionId?: string;
        senderName?: string;
        receiverName?: string;
    } = {
        paymentMode: 'NetBanking' // Default
    };

    // 1. Detect Mode
    // Check if line contains UPI identifier (handles date prefix)
    if (line.includes('UPI/') || line.includes('/UPI')) {
        result.paymentMode = 'UPI';
    } else if (line.match(/(ATM|WDL)/i)) {
        result.paymentMode = 'Cash';
    } else if (line.match(/(POS|COM|PUR)/i)) {
        result.paymentMode = 'Card';
    }

    // 2. Parse UPI Ref
    // SBI Format: [Date] UPI/DR/TxnID/Payee/Bank/UPI-ID/Type
    // Example: 04-11-25 UPI/DR/530549342075/Arulpand/YESB/paytmqr5vh/UPI
    if (result.paymentMode === 'UPI' && line.includes('/')) {
        // Splitting by '/' might be fragile if Payee name has slashes, but standard SBI format uses them as delimiters.
        // We find the segment starting with UPI/ to avoid date issues.
        const upiIndex = line.indexOf('UPI/');
        if (upiIndex !== -1) {
            const upiSegment = line.substring(upiIndex);
            const parts = upiSegment.split('/');

            // parts[0] = UPI
            // parts[1] = DR (or CR)
            // parts[2] = ID (530...)
            // parts[3] = NAME (Arulpand)

            // Trim all parts to handle spaces introduced by PDF text grouping
            const cleanParts = parts.map(p => p.trim());

            if (cleanParts.length >= 3) {
                // Try to grab ID from index 2
                // SBI IDs are usually 12 digits, but sometimes alphanumeric ref exists
                if (/^[A-Za-z0-9]+$/.test(cleanParts[2])) {
                    result.transactionId = cleanParts[2];
                }

                // If index 2 didn't look like an ID, searching specifically for 12-digit sequence
                if (!result.transactionId) {
                    const idMatch = upiSegment.match(/\/(\d{12})\//);
                    if (idMatch) result.transactionId = idMatch[1];
                }

                // Payee Name (Index 3 usually)
                if (cleanParts.length >= 4) {
                    let name = cleanParts[3];
                    // Clean up common noise
                    if (name && name.length > 1) {
                        name = name.replace(/_/g, ' ').trim();
                        result.payeeName = name;

                        if (type === 'expense') {
                            result.receiverName = name;
                        } else {
                            result.senderName = name;
                        }
                    }
                }
            }
        }
    }

    return result;
};
