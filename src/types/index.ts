import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'family' | 'office';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    createdAt: Date;
}

export interface AuditMetadata {
    createdBy: string;
    createdAt: Timestamp; // Firestore Timestamp
    updatedBy?: string;
    updatedAt?: Timestamp; // Firestore Timestamp
}

export interface Category {
    id?: string;
    name: string;
    subcategories: string[];
    type: 'expense' | 'income';
    userId: string;
    icon?: string;
    isDeleted?: boolean;
    audit: AuditMetadata;
}

export interface Expense {
    id?: string;
    amount: number;
    category: string;
    subcategory?: string;
    date: Timestamp | Date; // Firestore Timestamp or Date

    description: string;
    source: 'My Money' | 'Wife Money' | 'Mother Money';
    paymentMode?: 'Cash' | 'UPI' | 'Card' | 'NetBanking'; // Default 'Cash'

    // UPI / Bank Details
    transactionId?: string;
    googleTransactionId?: string; // Specific to GPay
    senderName?: string;
    senderUpiId?: string;
    receiverName?: string;
    receiverUpiId?: string;
    bankName?: string;

    userId: string;
    audit: AuditMetadata;
    isDeleted?: boolean; // Soft delete
}

export type IncomeSource = 'Salary' | 'Business' | 'Rent' | 'Interest' | 'Dividend' | 'Gift' | 'Refund' | 'Other';

export interface Income {
    id?: string;
    amount: number;
    source: IncomeSource;
    description: string;
    date: Timestamp | Date;
    userId: string;
    audit: AuditMetadata;
    isDeleted?: boolean;
}

export type ContractType = 'Rent' | 'Insurance' | 'AMC' | 'Warranty' | 'Other';

export interface Contract {
    id?: string;
    title: string;
    type: ContractType;
    provider: string; // e.g., "LIC", "Landlord", "Samsung"
    startDate: Timestamp | Date;
    expiryDate: Timestamp | Date;
    documentUrl?: string;
    description?: string;
    reminderEnabled: boolean;
    userId: string;
    audit: AuditMetadata;
    isDeleted?: boolean;
}
