import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    query,
    where,
    Timestamp,
    orderBy,
    getDoc,
    writeBatch
} from 'firebase/firestore';
import { Income, AuditMetadata } from '@/types';
import { User } from 'firebase/auth';

const COLLECTION_NAME = 'incomes';

// Helper to create audit metadata
const createAuditMetadata = (user: User): AuditMetadata => ({
    createdBy: user.uid,
    createdAt: Timestamp.now(),
});

const updateAuditMetadata = (existingAudit: AuditMetadata, user: User): AuditMetadata => ({
    ...existingAudit,
    updatedBy: user.uid,
    updatedAt: Timestamp.now(),
});

export const incomeService = {
    addIncome: async (income: Omit<Income, 'id' | 'audit' | 'userId'>, user: User) => {
        try {
            const audit = createAuditMetadata(user);
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...income,
                userId: user.uid, // Owner
                audit
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding income:', error);
            throw error;
        }
    },

    updateIncome: async (id: string, updates: Partial<Income>, user: User) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) throw new Error("Income not found");

            const existingData = docSnap.data() as Income;
            const audit = updateAuditMetadata(existingData.audit, user);

            await updateDoc(docRef, {
                ...updates,
                audit
            });
        } catch (error) {
            console.error('Error updating income:', error);
            throw error;
        }
    },

    deleteIncome: async (id: string, user: User) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) throw new Error("Income not found");
            const existingData = docSnap.data() as Income;
            const audit = updateAuditMetadata(existingData.audit, user);

            await updateDoc(docRef, {
                isDeleted: true,
                audit
            });
        } catch (error) {
            console.error('Error deleting income:', error);
            throw error;
        }
    },

    getAllIncomes: async (userId?: string) => {
        try {
            const constraints: any[] = [orderBy('date', 'desc')];
            if (userId) {
                constraints.push(where('userId', '==', userId));
            }

            const q = query(
                collection(db, COLLECTION_NAME),
                ...constraints
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Income[];
        } catch (error) {
            console.error("Error fetching incomes:", error);
            throw error;
        }
    },

    deleteIncomes: async (ids: string[], user: User) => {
        try {
            const batch = writeBatch(db);

            for (const id of ids) {
                const docRef = doc(db, COLLECTION_NAME, id);
                batch.update(docRef, {
                    isDeleted: true,
                    'audit.updatedBy': user.uid,
                    'audit.updatedAt': Timestamp.now()
                });
            }

            await batch.commit();
        } catch (error) {
            console.error('Error batch deleting incomes:', error);
            throw error;
        }
    }
};
