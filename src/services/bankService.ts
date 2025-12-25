import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import { uploadImage } from './storage';
import { encryptSensitive } from '../utils/encryptionUtils';

// --- Interfaces ---

export interface BankEntity {
    id?: string;
    type: 'Person' | 'Organization';
    name: string;
    pan?: string; // Optional for Person, usually required for Org
    meta?: {
        regNumber?: string;
        contactPerson?: string;
        contactPhone?: string;
        address?: string;
    };
    createdAt?: number;
}

export interface BankAccount {
    id?: string;
    entityId: string;
    bankName: string;
    branchName?: string;
    accountNumber: string;
    ifsc: string;
    type: 'Savings' | 'Current' | 'Credit';
    balance: number;
    images?: {
        passbook?: string;
    };
    customerId?: string;
    netbankingUser?: string;
    netbankingPasswordEncrypted?: string;
    profilePasswordEncrypted?: string;
    email?: string;
    mobile?: string;
    sharedWith?: string[]; // List of UIDs who can see this
}

export interface BankCard {
    id?: string;
    accountId: string;
    cardNumberEncrypted: string; // Full number encrypted
    cardNumberLast4: string;    // Visible last 4
    cvvEncrypted: string;
    pinEncrypted: string;
    expiryDate: string; // MM/YY
    nameOnCard: string;
    type: 'Visa' | 'Mastercard' | 'RuPay' | 'Amex';
    variant?: string; // Gold/Platinum
    limits?: {
        atm?: number;
        pos?: number;
        international?: boolean;
    };
}

export interface BankUPI {
    id?: string;
    accountId: string;
    upiId: string;
    provider: string; // GPay, PhonePe, etc.
    pinEncrypted?: string;
}

// --- Collections ---
const ENTITIES_COL = 'bank_entities';
const ACCOUNTS_COL = 'bank_accounts';
const CARDS_COL = 'bank_cards';
const UPI_COL = 'bank_upi';

// --- Services ---

// 1. Entities
export const addEntity = async (entity: BankEntity) => {
    const data = { ...entity, createdAt: Date.now() };
    const docRef = await addDoc(collection(db, ENTITIES_COL), data);
    return docRef.id;
};

export const getEntities = async (): Promise<BankEntity[]> => {
    // "Family Access" - Retrieve ALL entities. 
    // In a stricter app, we would filter by userId, but here we want shared family view.
    const q = query(collection(db, ENTITIES_COL));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BankEntity));
};

export const updateEntity = async (id: string, updates: Partial<BankEntity>) => {
    const docRef = doc(db, ENTITIES_COL, id);
    await updateDoc(docRef, updates);
};

export const deleteEntity = async (id: string) => {
    await deleteDoc(doc(db, ENTITIES_COL, id));
    // Note: Ideally acts as cascade delete for accounts, but manual for now.
};

// 2. Bank Accounts
export const addBankAccount = async (account: BankAccount, passbookFile?: File) => {
    let passbookUrl = account.images?.passbook || '';

    if (passbookFile) {
        const path = `bank_docs/${Date.now()}_${passbookFile.name}`;
        passbookUrl = await uploadImage(passbookFile, path);
    }

    const data = {
        ...account,
        images: { passbook: passbookUrl },
        createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, ACCOUNTS_COL), data);
    return docRef.id;
};

export const getBankAccounts = async (entityId?: string): Promise<BankAccount[]> => {
    let q;
    if (entityId) {
        q = query(collection(db, ACCOUNTS_COL), where('entityId', '==', entityId));
    } else {
        q = query(collection(db, ACCOUNTS_COL));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount));
};

export const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    await updateDoc(doc(db, ACCOUNTS_COL, id), updates);
};

export const deleteBankAccount = async (id: string) => {
    await deleteDoc(doc(db, ACCOUNTS_COL, id));
};

// 3. Cards
export const addBankCard = async (card: Omit<BankCard, 'id' | 'cardNumberLast4'> & { cardNumber: string }) => {
    const last4 = card.cardNumber.slice(-4);
    const encryptedNum = encryptSensitive(card.cardNumber);
    const { cardNumber, ...rest } = card;

    const finalCard: BankCard = {
        ...rest,
        cardNumberLast4: last4,
        cardNumberEncrypted: encryptedNum,
    };
    await addDoc(collection(db, CARDS_COL), finalCard);
};

export const getBankCards = async (accountId: string): Promise<BankCard[]> => {
    const q = query(collection(db, CARDS_COL), where('accountId', '==', accountId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BankCard));
};

export const deleteBankCard = async (id: string) => {
    await deleteDoc(doc(db, CARDS_COL, id));
};

// 4. UPI
export const addBankUPI = async (upi: BankUPI) => {
    await addDoc(collection(db, UPI_COL), upi);
};

export const getBankUPIs = async (accountId: string): Promise<BankUPI[]> => {
    const q = query(collection(db, UPI_COL), where('accountId', '==', accountId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BankUPI));
};

export const deleteBankUPI = async (id: string) => {
    await deleteDoc(doc(db, UPI_COL, id));
};
