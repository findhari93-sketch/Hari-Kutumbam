import { db, storage } from './firebase';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Contract, AuditMetadata } from '@/types';
import { User } from 'firebase/auth';

const COLLECTION_NAME = 'contracts';

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

export const contractService = {
    addContract: async (contract: Omit<Contract, 'id' | 'audit' | 'userId'>, user: User, file?: File) => {
        try {
            let documentUrl = '';
            if (file) {
                const storageRef = ref(storage, `contracts/${user.uid}/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                documentUrl = await getDownloadURL(storageRef);
            }

            const audit = createAuditMetadata(user);
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...contract,
                documentUrl: documentUrl || contract.documentUrl,
                userId: user.uid, // Owner
                audit
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding contract:', error);
            throw error;
        }
    },

    updateContract: async (id: string, updates: Partial<Contract>, user: User, file?: File) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) throw new Error("Contract not found");

            const existingData = docSnap.data() as Contract;
            const audit = updateAuditMetadata(existingData.audit, user);

            let documentUrl = existingData.documentUrl;
            if (file) {
                const storageRef = ref(storage, `contracts/${user.uid}/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                documentUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(docRef, {
                ...updates,
                documentUrl,
                audit
            });
        } catch (error) {
            console.error('Error updating contract:', error);
            throw error;
        }
    },

    deleteContract: async (id: string, user: User) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) throw new Error("Contract not found");
            const existingData = docSnap.data() as Contract;
            const audit = updateAuditMetadata(existingData.audit, user);

            await updateDoc(docRef, {
                isDeleted: true,
                audit
            });
        } catch (error) {
            console.error('Error deleting contract:', error);
            throw error;
        }
    },

    getAllContracts: async (userId?: string) => {
        try {
            const constraints: any[] = [orderBy('expiryDate', 'asc')];
            if (userId) {
                constraints.push(where('userId', '==', userId));
            }

            const q = query(
                collection(db, COLLECTION_NAME),
                ...constraints
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Contract[];
        } catch (error) {
            console.error("Error fetching contracts:", error);
            throw error;
        }
    }
};
