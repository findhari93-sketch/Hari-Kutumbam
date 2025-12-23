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
