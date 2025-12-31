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
    getDoc,
    writeBatch
} from 'firebase/firestore';
import { Expense, AuditMetadata } from '@/types';
import { User } from 'firebase/auth';

const COLLECTION_NAME = 'expenses';

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

export const expenseService = {
    addExpense: async (expense: Omit<Expense, 'id' | 'audit' | 'userId'>, user: User) => {
        try {
            const audit = createAuditMetadata(user);
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...expense,
                userId: user.uid, // Owner
                audit
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding expense:', error);
            throw error;
        }
    },

    updateExpense: async (id: string, updates: Partial<Expense>, user: User) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            // We need to fetch existing to get audit data if we want to preserve createdBy (though usually just adding updatedBy is enough)
            // But for 'audit' field, we need to merge.
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) throw new Error("Expense not found");

            const existingData = docSnap.data() as Expense;
            const audit = updateAuditMetadata(existingData.audit, user);

            await updateDoc(docRef, {
                ...updates,
                audit
            });
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    },

    deleteExpense: async (id: string, user: User) => {
        try {
            // Hard delete or Soft delete?
            // "I want to record delete... audited" -> Soft delete is better for audit.
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) throw new Error("Expense not found");
            const existingData = docSnap.data() as Expense;
            const audit = updateAuditMetadata(existingData.audit, user);

            await updateDoc(docRef, {
                isDeleted: true,
                audit
            });
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    },

    getAllExpenses: async () => {
        // Fetch ALL expenses (for Admin/Family). 
        // We might want to filter isDeleted in UI or here.
        // Let's return all and let UI filter or separate "Deleted" lists if needed for audit.
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy('date', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
        } catch (error) {
            console.error("Error fetching expenses:", error);
            throw error;
        }
    },
    // Batch Delete (Soft Delete)
    deleteExpenses: async (ids: string[], user: User) => {
        try {
            const batch = writeBatch(db);

            for (const id of ids) {
                const docRef = doc(db, COLLECTION_NAME, id);
                // We assume client already confirmed. We just set isDeleted.
                // Note: We can't easily get old data for audit in a batch without reading first (expensive).
                // Let's just set updatedBy/At.
                batch.update(docRef, {
                    isDeleted: true,
                    'audit.updatedBy': user.uid,
                    'audit.updatedAt': Timestamp.now()
                });
            }

            await batch.commit();
        } catch (error) {
            console.error('Error batch deleting expenses:', error);
            throw error;
        }
    },

    // Delete All Expenses (Hard or Soft?)
    // User requested "clear everything... start fresh".
    // Hard delete might be cleaner for "Start Fresh", but we usually prefer soft.
    // However, for "Clear All Data" feature usually implies Wiping.
    // Let's do Soft Delete for safety, but maybe moved to a "Archived" state? 
    // The requirement is "clear everything". Let's assume soft delete all is safest.
    deleteAllExpenses: async (user: User) => {
        try {
            // query all expenses for this user (or all if admin?)
            // If family scope, usually just the household.
            // Let's assume we delete all expenses in the collection or filtered by user?
            // "Clear everything from the DB" implies all expenses.

            const q = query(collection(db, COLLECTION_NAME));
            const snapshot = await getDocs(q);

            const batch = writeBatch(db);
            let count = 0;

            snapshot.docs.forEach((docSnapshot) => {
                batch.update(docSnapshot.ref, {
                    isDeleted: true,
                    'audit.updatedBy': user.uid,
                    'audit.updatedAt': Timestamp.now()
                });
                count++;
            });

            // Commit if any
            if (count > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error('Error deleting all expenses:', error);
            throw error;
        }
    }
};
