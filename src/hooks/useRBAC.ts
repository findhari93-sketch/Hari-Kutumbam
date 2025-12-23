'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userService';
import { UserProfile, UserRole } from '@/types';

export const useRBAC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                try {
                    const userProfile = await userService.getUserProfile(user.uid);
                    if (userProfile) {
                        setProfile(userProfile);
                        setRole(userProfile.role);
                    } else {
                        // Attempt sync if not found
                        const synced = await userService.syncUser(user);
                        setProfile(synced);
                        setRole(synced.role);
                    }
                } catch (err) {
                    console.error("RBAC fetch error", err);
                }
            }
            setLoading(false);
        };

        fetchProfile();
    }, [user]);

    const canViewSecrets = role === 'admin' || role === 'family'; // Office cannot
    const canEditGlobal = role === 'admin' || role === 'family';
    const canManageUsers = role === 'admin';

    return {
        user,
        profile,
        role,
        loading,
        canViewSecrets,
        canEditGlobal,
        canManageUsers
    };
};
