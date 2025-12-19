import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    getDocs,
    query,
    where,
    Timestamp,
    orderBy,
    limit,
} from 'firebase/firestore';

// --- Types ---
export type TransactionType = 'expense' | 'income';
export type PaymentMode = 'cash' | 'online' | 'card';

export interface Transaction {
    id?: string;
    userId: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: Timestamp;
    description?: string;
    paymentMode: PaymentMode;
    isMothersMoney?: boolean; // For liability tracking
    bankAccountId?: string; // Link to bank account
    createdAt: Timestamp;
}

export interface BankAccount {
    id?: string;
    userId: string;
    bankName: string;
    accountNumberLast4: string;
    currentBalance: number;
    type: 'savings' | 'current' | 'credit';
    updatedAt: Timestamp;
}

// --- Transactions ---
export const addTransaction = async (userId: string, data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'transactions'), {
            ...data,
            userId,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
};

export const getTransactions = async (userId: string, limitCount = 50) => {
    try {
        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', userId),
            orderBy('date', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Transaction[];
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};

// --- Bank Accounts (Smart Balance) ---
export const addBankAccount = async (userId: string, data: Omit<BankAccount, 'id' | 'userId' | 'updatedAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'bankAccounts'), {
            ...data,
            userId,
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding bank account: ", error);
        throw error;
    }
}

export const getBankAccounts = async (userId: string) => {
    try {
        const q = query(collection(db, 'bankAccounts'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BankAccount[];
    } catch (error) {
        console.error("Error getting bank accounts: ", error);
        throw error;
    }
}
