import { db, storage } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserProfile } from '@/types';
import { User } from 'firebase/auth';

export const userService = {
    // Sync Firebase Auth user to Firestore 'users' collection
    syncUser: async (user: User) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Create new user profile
            const newUser: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'User',
                photoURL: user.photoURL || '',
                role: 'family', // Default role. Admin must change manually or we logic it.
                createdAt: new Date(),
            };
            await setDoc(userRef, newUser);
            return newUser;
        } else {
            return userSnap.data() as UserProfile;
        }
    },

    getUserProfile: async (uid: string) => {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data() as UserProfile;
        }
        return null;
    },

    updateUserProfile: async (uid: string, data: Partial<UserProfile>) => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, data);
    },

    uploadAvatar: async (uid: string, file: File) => {
        try {
            const storageRef = ref(storage, `avatars/${uid}/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update profile
            await userService.updateUserProfile(uid, { photoURL: downloadURL });
            return downloadURL;
        } catch (error) {
            console.error("Error uploading avatar:", error);
            throw error;
        }
    }
};
