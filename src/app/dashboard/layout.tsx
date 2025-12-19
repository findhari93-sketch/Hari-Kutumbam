'use client';
import React, { useState } from 'react';
import { Box, Toolbar, CssBaseline } from '@mui/material';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { CircularProgress } from '@mui/material';

const drawerWidth = 240;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Protected Route Logic
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!user) {
        return null; // Will redirect
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <TopBar onMenuClick={handleDrawerToggle} />
            <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                }}
            >
                <Toolbar /> {/* Spacer for fixed AppBar */}
                {children}
            </Box>
        </Box>
    );
}
