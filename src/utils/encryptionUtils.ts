
// Simple client-side encryption usage for MVP. 
// In a production environment with high security requirements, 
// this should be replaced by a library like 'crypto-js' using AES 
// and a user-derived key that isn't stored in the code.

const SECRET_SALT = 'EXPENSE_TRACKER_BANK_SALT_2025';

export const encryptSensitive = (text: string): string => {
    if (!text) return '';
    try {
        // Simple obfuscation: Base64(text + SALT)
        // This prevents casual reading in the DB console but is NOT cryptographically secure against determined attackers.
        const combined = text + '::' + SECRET_SALT;
        return btoa(combined);
    } catch (e) {
        console.error("Encryption failed", e);
        return text;
    }
};

export const decryptSensitive = (cipher: string): string => {
    if (!cipher) return '';
    try {
        const decoded = atob(cipher);
        const parts = decoded.split('::');
        if (parts.length > 0) {
            return parts[0];
        }
        return decoded;
    } catch (e) {
        console.error("Decryption failed", e);
        return cipher;
    }
};

export const maskCardNumber = (cardNumber: string): string => {
    if (!cardNumber || cardNumber.length < 4) return cardNumber;
    const last4 = cardNumber.slice(-4);
    return `•••• •••• •••• ${last4}`;
};
