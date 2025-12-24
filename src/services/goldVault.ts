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
} from 'firebase/firestore';

export interface AuditRecord {
    timestamp: number;
    dateStr: string;
    action: 'Created' | 'Updated' | 'Deleted';
    details: string; // e.g., "Location changed from Safe A to Locker"
}

export interface GoldItem {
    id?: string;
    userId: string;
    name: string;
    weight: number;
    owner: string; // Mother, Wife, Self
    location: string; // Home Safe, Locker, etc
    image: string; // URL
    auditLog: AuditRecord[];
    createdAt: number; // Timestamp
}

const COLLECTION = 'gold_items';

export const addGoldItem = async (userId: string, item: Omit<GoldItem, 'id' | 'userId' | 'auditLog' | 'createdAt'>) => {
    try {
        const timestamp = Date.now();
        const initialAudit: AuditRecord = {
            timestamp,
            dateStr: new Date(timestamp).toLocaleString(),
            action: 'Created',
            details: `Item created in ${item.location}`
        };

        const docRef = await addDoc(collection(db, COLLECTION), {
            ...item,
            userId,
            auditLog: [initialAudit],
            createdAt: timestamp
        });
        return docRef.id;
    } catch (e) {
        console.error("Error addGoldItem:", e);
        throw e;
    }
};

export const updateGoldItem = async (itemId: string, updates: Partial<GoldItem>, oldItem: GoldItem) => {
    try {
        const timestamp = Date.now();
        const changes: string[] = [];

        // Detect Changes for Audit
        if (updates.location && updates.location !== oldItem.location) {
            changes.push(`Location moved from '${oldItem.location}' to '${updates.location}'`);
        }
        if (updates.weight && updates.weight !== oldItem.weight) {
            changes.push(`Weight changed from ${oldItem.weight}g to ${updates.weight}g`);
        }
        if (updates.owner && updates.owner !== oldItem.owner) {
            changes.push(`Owner transferred from ${oldItem.owner} to ${updates.owner}`);
        }
        if (updates.name && updates.name !== oldItem.name) {
            changes.push(`Renamed from '${oldItem.name}' to '${updates.name}'`);
        }
        if (changes.length === 0 && Object.keys(updates).length > 0) {
            changes.push('Item details updated');
        }

        const newAudit: AuditRecord = {
            timestamp,
            dateStr: new Date(timestamp).toLocaleString(),
            action: 'Updated',
            details: changes.join('. ')
        };

        const docRef = doc(db, COLLECTION, itemId);
        await updateDoc(docRef, {
            ...updates,
            auditLog: [...oldItem.auditLog, newAudit]
        });
    } catch (e) {
        console.error("Error updateGoldItem:", e);
        throw e;
    }
};

export const deleteGoldItem = async (itemId: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION, itemId));
    } catch (e) {
        console.error("Error deleteGoldItem:", e);
        throw e;
    }
};

export const getGoldItems = async (userId: string): Promise<GoldItem[]> => {
    try {
        // For development/demo, if userId is optional or we want all items, adjust query.
        // Assuming strict user ownership for now.
        const q = query(collection(db, COLLECTION), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GoldItem));
    } catch (e) {
        console.error("Error getGoldItems:", e);
        throw e;
    }
};
