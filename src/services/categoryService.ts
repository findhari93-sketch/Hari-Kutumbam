import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Category, AuditMetadata, UserProfile } from '@/types';

const COLLECTION_NAME = 'categories';

// Helper to create audit metadata
const createAuditMetadata = (user: UserProfile | any): AuditMetadata => ({
    createdBy: user.uid,
    createdAt: Timestamp.now(),
    updatedBy: user.uid,
    updatedAt: Timestamp.now()
});

export const categoryService = {
    // Add a new Category
    addCategory: async (category: Omit<Category, 'id' | 'audit'>, user: any) => {
        try {
            const audit = createAuditMetadata(user);
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...category,
                userId: user.uid,
                audit,
                isDeleted: false
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    },

    // Get all categories for a user (and maybe default ones?)
    // For now, let's fetch categories owned by the user.
    getUserCategories: async (userId: string) => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                where('isDeleted', '==', false)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Category));
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    // Update a Category (e.g. add subcategory)
    updateCategory: async (id: string, updates: Partial<Category>, user: any) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...updates,
                'audit.updatedBy': user.uid,
                'audit.updatedAt': Timestamp.now()
            });
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    // Soft Delete a Category
    deleteCategory: async (id: string, user: any) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                isDeleted: true,
                'audit.updatedBy': user.uid,
                'audit.updatedAt': Timestamp.now()
            });
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }
};
