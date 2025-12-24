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

export interface GiftPlan {
    id?: string;
    userId: string;
    recipientName: string;
    recipientContact?: string;
    plannedWeight: number; // in grams
    occasion: string; // Wedding, Birthday
    targetDate: number; // Timestamp or rough year timestamp
    status: 'Planned' | 'Purchased' | 'Gifted';
    notes?: string;
    auditLog?: any[];
}

const COLLECTION = 'gold_gift_plans';

export const giftPlanningService = {
    addPlan: async (userId: string, plan: Omit<GiftPlan, 'id' | 'userId'>) => {
        try {
            await addDoc(collection(db, COLLECTION), {
                ...plan,
                userId,
                createdAt: Date.now()
            });
        } catch (error) {
            console.error("Error adding gift plan", error);
            throw error;
        }
    },

    getPlans: async (userId: string) => {
        try {
            const q = query(collection(db, COLLECTION), where('userId', '==', userId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GiftPlan));
        } catch (error) {
            console.error("Error fetching plans", error);
            throw error;
        }
    },

    updatePlan: async (id: string, updates: Partial<GiftPlan>) => {
        try {
            await updateDoc(doc(db, COLLECTION, id), updates);
        } catch (error) {
            console.error("Error updating plan", error);
            throw error;
        }
    },

    deletePlan: async (id: string) => {
        try {
            await deleteDoc(doc(db, COLLECTION, id));
        } catch (error) {
            console.error("Error deleting plan", error);
            throw error;
        }
    }
};
