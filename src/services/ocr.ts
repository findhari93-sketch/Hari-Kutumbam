import Tesseract from 'tesseract.js';

export interface ExtractedTransactionData {
    amount?: string;
    date?: string;
    description?: string;

    // Explicit UPI Data
    paymentMode?: 'Cash' | 'UPI' | 'Card' | 'NetBanking';
    transactionId?: string;
    googleTransactionId?: string;
    senderName?: string;
    senderUpiId?: string;
    receiverName?: string;
    receiverUpiId?: string;
    bankName?: string;
}

export const parseScreenshot = async (imageFile: File): Promise<ExtractedTransactionData> => {
    try {
        const worker = await Tesseract.createWorker('eng');

        // Try multiple PSMs if amount is not found
        // 3: Auto (Default), 4: Single Column (good for receipts), 6: Uniform Block
        const psms = ['3', '4', '6'];
        let finalData: ExtractedTransactionData = { paymentMode: 'Cash' };

        for (const psm of psms) {
            console.log(`OCR Attempt with PSM ${psm}...`);
            await worker.setParameters({
                tessedit_pageseg_mode: psm as any
            });

            const ret = await worker.recognize(imageFile);
            const text = ret.data.text;
            console.log(`OCR Raw Text (PSM ${psm}):`, text);

            const data = extractDataFromText(text);

            // If we found an amount, we are good!
            // Or if we found explicit transaction IDs, we might be good even if amount is missed (user can fill it),
            // but our goal is amount.
            if (data.amount) {
                finalData = data;
                break;
            }

            // Keep the best data we found so far (e.g. if we found Date/ID but not amount in pass 1, keep it)
            //Merging logic: prioritize new non-null values
            finalData = { ...finalData, ...data };

            // If we have at least ID and Date, maybe stop? No, we prioritize Amount.
        }

        await worker.terminate();
        return finalData;

    } catch (error) {
        console.error('OCR Error:', error);
        throw error;
    }
};


const extractGPaySimpleData = (lines: string[]): Partial<ExtractedTransactionData> => {
    const data: Partial<ExtractedTransactionData> = {};
    const paidToIndex = lines.findIndex(line => line.trim().match(/^Paid to/i));

    if (paidToIndex !== -1) {
        // --- 1. Amount (Above "Paid to") ---
        // Iterate backwards from "Paid to"
        for (let i = paidToIndex - 1; i >= 0; i--) {
            let line = lines[i].trim();
            if (!line) continue;

            // Fix commonly mistaken Rupee symbols: '2', '7', '?', 't' appearing before number
            // e.g. "2 30.00" -> "30.00"
            line = line.replace(/^[27?tT]\s+/, '');

            // Match simple number (no symbol required for this specific screen type)
            // e.g., "30.00"
            const amountMatch = line.match(/^[\d,]+(\.\d{1,2})?$/);
            if (amountMatch) {
                data.amount = amountMatch[0].replace(/,/g, '');
                break;
            }
        }

        // --- 2. Payee (After "Paid to") ---
        if (paidToIndex + 1 < lines.length) {
            const payeeLine = lines[paidToIndex + 1].trim();
            // Avoid extracting "Banking name:" as payee if it appears immediately
            if (payeeLine && !payeeLine.toLowerCase().startsWith('banking name')) {
                data.receiverName = payeeLine;
                data.description = `Paid to ${payeeLine}`;
            }
        }

        // --- 3. Bank Name ---
        const bankLine = lines.find(l => l.toLowerCase().includes('banking name:'));
        if (bankLine) {
            const match = bankLine.match(/Banking name:\s*(.+)/i);
            if (match) data.bankName = match[1];
        }
    }
    return data;
};

const extractDataFromText = (text: string): ExtractedTransactionData => {
    // Split into lines for structural analysis
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Default Data
    let data: ExtractedTransactionData = {
        paymentMode: 'Cash'
    };

    // --- STRATEGY 1: Structured "Paid to" Layout (Simple GPay) ---
    const simpleData = extractGPaySimpleData(lines);
    if (simpleData.amount) {
        data = { ...data, ...simpleData, paymentMode: 'UPI' };
    }

    // --- STRATEGY 2: Classical Regex Search (Backup / Augment) ---

    // A. Amount (If not found yet)
    if (!data.amount) {
        const currencyRegex = /(?:₹|Rs\.?|INR|[\u20B9\u20A8]|(?<=^|\n)\s*[tT7?F]\.?\s*)([\d,]+(?:\.\d{0,2})?)/i;
        const amountMatch = text.match(currencyRegex);
        if (amountMatch) {
            data.amount = amountMatch[1].replace(/,/g, '');
        } else {
            const commaNumberRegex = /(^|\s)([\d]{1,3}(?:,[\d]{3})+(?:\.\d{2})?)(\s|$)/;
            const match = text.match(commaNumberRegex);
            if (match) data.amount = match[2].replace(/,/g, '');
        }

        // Attempt 3: Multiline "To ... Amount" (for Detailed GPay)
        if (!data.amount) {
            const toAmountMatch = text.match(/To\s+[^\n]+\s*\n\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/i);
            if (toAmountMatch) {
                const valStr = toAmountMatch[1].replace(/,/g, '');
                const val = parseFloat(valStr);
                // Safety: Year check. Commas imply currency usually.
                const isYear = val > 1900 && val < 2100 && !toAmountMatch[1].includes(',');
                if (!isYear) data.amount = valStr;
            }
        }
    }

    // B. Date & Time
    // Updated Regex to handle missing colon: "617 pm"
    const dateTimeRegex = /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}),?\s+(\d{1,2}:?\d{2}\s*[ap]m)/i;
    const dateMatch = text.match(dateTimeRegex);

    if (dateMatch) {
        let timeStr = dateMatch[2];
        // Insert colon if missing
        if (!timeStr.includes(':')) {
            timeStr = timeStr.replace(/(\d+)(\d{2}\s*[ap]m)/i, '$1:$2');
        }
        const dateStr = `${dateMatch[1]} ${timeStr}`;
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
            data.date = dateObj.toISOString();
        }
    } else if (!data.date) {
        const dateOnlyRegex = /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/;
        const dMatch = text.match(dateOnlyRegex);
        if (dMatch) {
            const dateObj = new Date(dMatch[1]);
            if (!isNaN(dateObj.getTime())) data.date = dateObj.toISOString();
        }
    }

    // C. IDs & Additional Info (augmenting simple data if needed)
    const upiTxnIdRegex = /UPI transaction ID\s*(\d+)/i;
    const gPayTxnIdRegex = /Google transaction ID\s*([A-Za-z0-9]+)/i;

    if (!data.transactionId) {
        const match = text.match(upiTxnIdRegex);
        if (match) {
            data.transactionId = match[1];
            data.paymentMode = 'UPI';
        }
    }
    if (!data.googleTransactionId) {
        const match = text.match(gPayTxnIdRegex);
        if (match) {
            data.googleTransactionId = match[1];
            data.paymentMode = 'UPI';
        }
    }

    // D. Description/Receiver (If not set by Simple Strategy)
    if (!data.receiverName) {
        const toMatch = text.match(/To:?\s*(.+)/i);
        if (toMatch) {
            data.receiverName = toMatch[1].trim();
            if (!data.description) data.description = `Paid to ${data.receiverName}`;
        }
    }

    // E. Bank Name (If not set)
    if (!data.bankName) {
        const bankMatch = text.match(/([A-Za-z ]+Bank[A-Za-z ]*)\s+\d{4}/i);
        if (bankMatch) data.bankName = bankMatch[1].trim();
    }

    return data;
};
