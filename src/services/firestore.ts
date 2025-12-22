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

// --- Milk Tracker ---

export interface MilkLog {
    id?: string;
    userId: string;
    date: string; // YYYY-MM-DD
    quantity: number;
    pricePerLiter: number;
    cost: number;
    boiled: boolean;
    status: 'bought' | 'skipped';
    vendorName?: string;
    recordedBy?: string; // Name of user who added this
    timestamp: Timestamp;
}

export interface MilkPayment {
    id?: string;
    userId: string;
    date: string; // YYYY-MM-DD
    amount: number;
    note?: string;
    recordedBy?: string; // Name of user who added this
    timestamp: Timestamp;
}

export const addMilkLog = async (userId: string, data: Omit<MilkLog, 'id' | 'userId' | 'timestamp'>) => {
    try {
        // Check if log exists for this date (globally for family)
        const q = query(
            collection(db, 'milk_logs'),
            where('date', '==', data.date)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Update existing
            const docId = snapshot.docs[0].id;
            await updateDoc(doc(db, 'milk_logs', docId), {
                ...data, // This might overwrite recordedBy, which is fine or we can preserve it
                timestamp: Timestamp.now()
            });
            return docId;
        }

        const docRef = await addDoc(collection(db, 'milk_logs'), {
            ...data,
            userId,
            timestamp: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding milk log:", error);
        throw error;
    }
};

export const addMilkPayment = async (userId: string, data: Omit<MilkPayment, 'id' | 'userId' | 'timestamp'>) => {
    try {
        const docRef = await addDoc(collection(db, 'milk_payments'), {
            ...data,
            userId,
            timestamp: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding milk payment:", error);
        throw error;
    }
};

export const getMilkLogs = async (userId: string, monthStr?: string) => {
    // monthStr format: "YYYY-MM"
    try {
        let q = query(
            collection(db, 'milk_logs'),
            // Removed userId filter for shared family view
            orderBy('date', 'desc')
        );

        // Basic filtering if needed, but client-side filtering might be easier for small datasets
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MilkLog[];

        if (monthStr) {
            return logs.filter(log => log.date.startsWith(monthStr));
        }
        return logs;
    } catch (error) {
        console.error("Error getting milk logs:", error);
        throw error;
    }
};

export const getMilkPayments = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'milk_payments'),
            // Removed userId filter for shared family view
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MilkPayment[];
    } catch (error) {
        console.error("Error getting milk payments:", error);
        throw error;
    }
};
