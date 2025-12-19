import Tesseract from 'tesseract.js';

export interface ExtractedTransactionData {
    amount?: string;
    date?: string;
    recipient?: string; // Vendor name
}

export const parseScreenshot = async (imageFile: File): Promise<ExtractedTransactionData> => {
    try {
        const worker = await Tesseract.createWorker('eng');
        const ret = await worker.recognize(imageFile);
        await worker.terminate();

        const text = ret.data.text;
        console.log('OCR Text:', text);

        return extractDataFromText(text);
    } catch (error) {
        console.error('OCR Error:', error);
        throw error;
    }
};

const extractDataFromText = (text: string): ExtractedTransactionData => {
    const data: ExtractedTransactionData = {};

    // 1. Extract Amount (Matches ₹ 500, Rs. 500, or just 500.00 near "Paid")
    // Regex needs to be flexible. 
    // Look for lines starting with ₹ or containing "Paid ₹"
    const amountRegex = /[₹Rs]\.?\s*([\d,]+(\.\d{2})?)/i;
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
        data.amount = amountMatch[1].replace(/,/g, '');
    }

    // 2. Extract Date (Matches "DD MMM YYYY" or "DD/MM/YYYY")
    // GPay often shows "Paid on 19 Dec 2024"
    const dateRegex = /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})|(\d{1,2}\/\d{1,2}\/\d{4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
        // Need to convert to YYYY-MM-DD
        const dateStr = dateMatch[0];
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
            data.date = dateObj.toISOString().split('T')[0];
        }
    }

    // 3. Extract Recipient (Usually top line or after "To")
    // This is harder. Heuristic: Look for "Paid to"
    const paidToRegex = /Paid to\s+(.+)/i;
    const paidToMatch = text.match(paidToRegex);
    if (paidToMatch) {
        data.recipient = paidToMatch[1].trim();
    }

    return data;
};
