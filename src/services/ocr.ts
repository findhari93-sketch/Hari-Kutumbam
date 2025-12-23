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
        const ret = await worker.recognize(imageFile);
        await worker.terminate();

        const text = ret.data.text;
        console.log('OCR Raw Text:', text);

        return extractDataFromText(text);
    } catch (error) {
        console.error('OCR Error:', error);
        throw error;
    }
};

const extractDataFromText = (text: string): ExtractedTransactionData => {
    const data: ExtractedTransactionData = {
        paymentMode: 'Cash' // Default, will switch if we find UPI signals
    };

    // --- 1. Amount ---
    // Strategy:
    // 1. Look for currency symbol prefix (₹, Rs, INR).
    //    OCR often misreads ₹ as '?', 'F', 't', or other symbols. 
    //    We allow a loose check for "symbol-like" char before valid number.
    // 2. Fallback: Look for any number with a COMMA (e.g. 3,800). 
    //    Phone numbers/IDs usually don't have commas.

    // Attempt 1: Strict/Loose Currency Pattern
    const currencyRegex = /(?:₹|Rs\.?|INR|[\u20B9\u20A8])\s*([\d,]+(?:\.\d{2})?)/i;
    let amountMatch = text.match(currencyRegex);

    if (amountMatch) {
        data.amount = amountMatch[1].replace(/,/g, '');
    } else {
        // Attempt 2: Numbers with commas (e.g. "3,800")
        // This avoids matching IDs "534..." or Phones "984..." which are usually blocks of digits.
        const commaNumberRegex = /(?:\s|^)([\d]{1,3}(?:,[\d]{2,3})+)(?:\.\d{2})?(?:\s|$)/;
        amountMatch = text.match(commaNumberRegex);
        if (amountMatch) {
            data.amount = amountMatch[1].replace(/,/g, '');
        }
    }

    // --- 2. Date & Time ---
    // "15 Dec 2025, 6:01 pm"
    // Regex for: DD MMM YYYY, H:MM am/pm
    const dateTimeRegex = /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}),?\s+(\d{1,2}:\d{2}\s*[ap]m)/i;
    const dateMatch = text.match(dateTimeRegex);
    if (dateMatch) {
        const dateStr = `${dateMatch[1]} ${dateMatch[2]}`;
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
            data.date = dateObj.toISOString(); // Full ISO for timestamp
        }
    } else {
        // Fallback to just Date
        const dateOnlyRegex = /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/;
        const dMatch = text.match(dateOnlyRegex);
        if (dMatch) {
            const dateObj = new Date(dMatch[1]);
            if (!isNaN(dateObj.getTime())) data.date = dateObj.toISOString();
        }
    }

    // --- 3. Description (Heuristic) ---
    // Look for text usually below the Amount but above "Completed"
    // This is hard to guarantee with simple string search, but we can try specific GPay markers.
    // Example: "Srinivas salary return\n\nCompleted"
    const descRegex = /([A-Za-z0-9 ]+)\n+Completed/i;
    const descMatch = text.match(descRegex);
    if (descMatch) {
        data.description = descMatch[1].trim();
    } else if (text.includes("Paid to")) {
        // Fallback: "Paid to X"
        const paidToMatch = text.match(/Paid to\s+(.+)/i);
        if (paidToMatch) data.description = `Paid to ${paidToMatch[1]}`;
    }

    // --- 4. IDs (UPI / Google) ---
    const upiTxnIdRegex = /UPI transaction ID\s*(\d+)/i;
    const gPayTxnIdRegex = /Google transaction ID\s*([A-Za-z0-9]+)/i;

    const upiMatch = text.match(upiTxnIdRegex);
    const gPayMatch = text.match(gPayTxnIdRegex);

    if (upiMatch) {
        data.transactionId = upiMatch[1];
        data.paymentMode = 'UPI'; // Found UPI ID -> Switch mode
    }
    if (gPayMatch) {
        data.googleTransactionId = gPayMatch[1];
        data.paymentMode = 'UPI'; // Found GPay ID -> Switch mode
    }

    // --- 5. Sender / Receiver ---
    // "To: HARIBABU MANOHARAN"
    // "From: AJITHKUMAR S"
    const toRegex = /To:?\s*(.+)/i;
    const fromRegex = /From:?\s*(.+)/i;

    const toMatch = text.match(toRegex);
    const fromMatch = text.match(fromRegex);

    if (toMatch) {
        // Extract Name and possible UPI ID if on next line
        // GPay: "To: NAME \n Google Pay . name@bank"
        data.receiverName = toMatch[1].trim();

        // Try to find UPI ID nearby? (Simpler: Just regex for any email-like string)
        // This is generic scanning for UPI IDs in the whole text might be safer for now
    }
    if (fromMatch) {
        data.senderName = fromMatch[1].trim();
    }

    // Find UPI IDs (roughly email format ending in @bank)
    const upiIdRegex = /[a-zA-Z0-9._]+@[a-zA-Z]+/g;
    const upiIds = text.match(upiIdRegex);

    if (upiIds && upiIds.length >= 2) {
        // heuristic: 1st is usually Receiver (near "To"), 2nd is Sender (near "From")
        // But verifying position is hard in just text.
        // Let's assign based on previous To/From proximity if possible, or just guess.

        // For now, let's just attempt to map if we found names
        if (data.receiverName && !data.receiverUpiId) data.receiverUpiId = upiIds[0];
        if (data.senderName && !data.senderUpiId) data.senderUpiId = upiIds[1];
    }

    // --- 6. Bank Name ---
    // "State Bank of India 2117"
    const bankRegex = /([A-Za-z ]+Bank[A-Za-z ]*)\s+\d{4}/i;
    const bankMatch = text.match(bankRegex);
    if (bankMatch) {
        data.bankName = bankMatch[1].trim();
        data.paymentMode = 'UPI';
    }

    return data;
};
