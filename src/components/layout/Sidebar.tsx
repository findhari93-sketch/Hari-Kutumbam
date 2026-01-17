'use client';
import React from 'react';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Drawer,
    Box,
    Divider,
    Typography,
    Toolbar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'; // Expenses
import LocalDrinkIcon from '@mui/icons-material/LocalDrink'; // Milk
import DiamondIcon from '@mui/icons-material/Diamond'; // Gold
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Banks
import HandshakeIcon from '@mui/icons-material/Handshake'; // Loans
import ApartmentIcon from '@mui/icons-material/Apartment'; // Real Estate
import SettingsIcon from '@mui/icons-material/Settings';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Income
import GavelIcon from '@mui/icons-material/Gavel'; // Contracts
import AssessmentIcon from '@mui/icons-material/Assessment'; // Reports
import { usePathname, useRouter } from 'next/navigation';

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Income', icon: <AttachMoneyIcon />, path: '/dashboard/income' },
    { text: 'Expenses', icon: <ReceiptLongIcon />, path: '/dashboard/expenses' },
    { text: 'Contracts', icon: <GavelIcon />, path: '/dashboard/contracts' },
    { text: 'Analytics & Reports', icon: <AssessmentIcon />, path: '/dashboard/reports' },
    { text: 'Categories', icon: <AccountTreeIcon />, path: '/dashboard/categories' },
    { text: 'Milk Tracker', icon: <LocalDrinkIcon />, path: '/dashboard/milk' },
    { text: 'Gold Vault', icon: <DiamondIcon />, path: '/dashboard/gold' },
    { text: 'My Banks', icon: <AccountBalanceIcon />, path: '/dashboard/banks' },
    { text: 'Loans', icon: <HandshakeIcon />, path: '/dashboard/loans' },
    { text: 'Real Estate', icon: <ApartmentIcon />, path: '/dashboard/real-estate' },
    { text: 'Import Statement', icon: <UploadFileIcon />, path: '/dashboard/import' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/dashboard/settings' },
];

interface SidebarProps {
    mobileOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const handleNavigation = (path: string) => {
        router.push(path);
        onClose(); // Close drawer on mobile after click
    };

    const drawerContent = (
        <div>
            <Toolbar sx={{ justifyContent: 'center', alignItems: 'center', gap: 1.5, py: 3, mb: 1 }}>
                <Box component="img" src="/logo.png" alt="Logo" sx={{ height: 40, width: 40, borderRadius: '12px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }} />
                <Typography variant="h6" noWrap component="div" sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em',
                    fontSize: '1.25rem'
                }}>
                    Hari Kutumbam
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={pathname === item.path}
                            onClick={() => handleNavigation(item.path)}
                        >
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onClose}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}
