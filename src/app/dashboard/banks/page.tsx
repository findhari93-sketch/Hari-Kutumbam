'use client';
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, IconButton, Breadcrumbs, Link,
    Drawer, CircularProgress, useTheme, useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ShareIcon from '@mui/icons-material/Share';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '@/context/AuthContext';

// Services
import {
    BankEntity, BankAccount, BankCard, BankUPI,
    getEntities, getBankAccounts, getBankCards, getBankUPIs,
    addEntity, updateEntity, addBankAccount, updateBankAccount
} from '@/services/bankService';
import { decryptSensitive } from '@/utils/encryptionUtils';

// Components
import EntityList from '@/components/banks/EntityList';
import EntityForm from '@/components/banks/EntityForm';
import AccountList from '@/components/banks/AccountList';
import AccountForm from '@/components/banks/AccountForm';
import CardManager from '@/components/banks/CardManager';
import UPIManager from '@/components/banks/UPIManager';
import ShareMenu from '@/components/banks/ShareMenu';

export default function BanksPage() {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Navigation State
    const [view, setView] = useState<'entities' | 'accounts'>('entities');
    const [activeEntity, setActiveEntity] = useState<BankEntity | null>(null);
    const [activeAccount, setActiveAccount] = useState<BankAccount | null>(null);

    // Data State
    const [entities, setEntities] = useState<BankEntity[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);

    // Sub-Data State (for active account)
    const [cards, setCards] = useState<BankCard[]>([]);
    const [upis, setUpis] = useState<BankUPI[]>([]);

    // Dialogs/Drawers State
    const [openEntityForm, setOpenEntityForm] = useState(false);
    const [openAccountForm, setOpenAccountForm] = useState(false);
    const [openManageDrawer, setOpenManageDrawer] = useState(false);
    const [openShare, setOpenShare] = useState(false);

    // Edit Mode State
    const [editingEntity, setEditingEntity] = useState<BankEntity | null>(null);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

    // --- Effects ---

    useEffect(() => {
        if (user) {
            loadEntities();
        }
    }, [user]);

    useEffect(() => {
        if (activeEntity) {
            loadAccounts(activeEntity.id!);
        }
    }, [activeEntity]);

    useEffect(() => {
        if (activeAccount) {
            loadAccountDetails(activeAccount.id!);
        }
    }, [activeAccount]);

    // --- Loaders ---

    const loadEntities = async () => {
        setLoading(true);
        try {
            const data = await getEntities();
            setEntities(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const loadAccounts = async (entityId: string) => {
        try {
            const data = await getBankAccounts(entityId);
            setAccounts(data);
        } catch (e) { console.error(e); }
    };

    const loadAccountDetails = async (accountId: string) => {
        try {
            const c = await getBankCards(accountId);
            const u = await getBankUPIs(accountId);
            setCards(c);
            setUpis(u);
        } catch (e) { console.error(e); }
    };

    // --- Handlers ---

    const handleEntitySelect = (entity: BankEntity) => {
        setActiveEntity(entity);
        setView('accounts');
    };

    const handleSaveEntity = async (data: any) => {
        if (editingEntity) {
            await updateEntity(editingEntity.id!, data);
        } else {
            await addEntity(data);
        }
        loadEntities();
        setEditingEntity(null);
    };

    const handleSaveAccount = async (data: any, file?: File) => {
        if (editingAccount) {
            await updateBankAccount(editingAccount.id!, data);
        } else {
            await addBankAccount(data, file);
        }
        if (activeEntity) loadAccounts(activeEntity.id!);
        setEditingAccount(null);
    };

    const openManageAccount = (acc: BankAccount) => {
        setActiveAccount(acc);
        setOpenManageDrawer(true);
    };

    // --- Render ---

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 2, pb: 10 }}>
            {/* Header / Breadcrumbs */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    {view === 'accounts' && activeEntity ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={() => setView('entities')} size="small" edge="start">
                                <ArrowBackIcon />
                            </IconButton>
                            <Box>
                                <Typography variant="h5" fontWeight="bold">{activeEntity.name}</Typography>
                                <Typography variant="caption" color="text.secondary">Bank Accounts</Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="h4" fontWeight="bold" sx={{
                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                Family Bank Manager
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Securely share & manage details
                            </Typography>
                        </Box>
                    )}
                </Box>

                {view === 'entities' ? (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => { setEditingEntity(null); setOpenEntityForm(true); }}
                        size={isMobile ? "small" : "medium"}
                    >
                        Add Entity
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => { setEditingAccount(null); setOpenAccountForm(true); }}
                        size={isMobile ? "small" : "medium"}
                    >
                        Add Account
                    </Button>
                )}
            </Box>

            {/* Content */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : view === 'entities' ? (
                <EntityList
                    entities={entities}
                    onSelect={handleEntitySelect}
                    onEdit={(e) => { setEditingEntity(e); setOpenEntityForm(true); }}
                />
            ) : (
                <AccountList
                    accounts={accounts}
                    onEdit={openManageAccount} // Using Edit to open Manage Drawer including Edit options
                    onShare={(acc) => { setActiveAccount(acc); handleEntitySelect(activeEntity!); loadAccountDetails(acc.id!); setOpenShare(true); }}
                />
            )}

            {/* --- Dialogs & Drawers --- */}

            {/* Entity Form */}
            <EntityForm
                open={openEntityForm}
                onClose={() => setOpenEntityForm(false)}
                onSave={handleSaveEntity}
                initialData={editingEntity}
            />

            {/* Account Form */}
            {activeEntity && (
                <AccountForm
                    open={openAccountForm}
                    onClose={() => setOpenAccountForm(false)}
                    onSave={handleSaveAccount}
                    initialData={editingAccount}
                    entityId={activeEntity.id!}
                />
            )}

            {/* Manage Account Drawer (Cards / UPI / Details) */}
            <Drawer
                anchor="bottom"
                open={openManageDrawer}
                onClose={() => setOpenManageDrawer(false)}
                PaperProps={{
                    sx: {
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        maxHeight: '90vh',
                        height: 'auto'
                    }
                }}
            >
                {activeAccount && (
                    <Box sx={{ p: 2, pb: 4 }}>
                        <Box sx={{ width: 40, height: 4, bgcolor: 'grey.300', borderRadius: 2, mx: 'auto', mb: 2 }} />

                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Manage Account: {activeAccount.bankName}
                        </Typography>

                        {/* Net Banking Credecntials Section */}
                        {(activeAccount.netbankingUser || activeAccount.netbankingPasswordEncrypted) && (
                            <NetBankingSection account={activeAccount} />
                        )}

                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            <Button variant="outlined" size="small" startIcon={<ShareIcon />} onClick={() => setOpenShare(true)}>
                                Share Details
                            </Button>
                            <Button variant="outlined" size="small" onClick={() => { setEditingAccount(activeAccount); setOpenAccountForm(true); setOpenManageDrawer(false); }}>
                                Edit Account
                            </Button>
                        </Box>

                        <CardManager
                            accountId={activeAccount.id!}
                            cards={cards}
                            onRefresh={() => loadAccountDetails(activeAccount.id!)}
                        />

                        <UPIManager
                            accountId={activeAccount.id!}
                            upis={upis}
                            onRefresh={() => loadAccountDetails(activeAccount.id!)}
                        />
                    </Box>
                )}
            </Drawer>

            {/* Share Menu */}
            <ShareMenu
                open={openShare}
                onClose={() => setOpenShare(false)}
                account={activeAccount}
                entity={activeEntity}
                cards={cards}
                upis={upis}
            />

        </Box>
    );
}

function NetBankingSection({ account }: { account: BankAccount }) {
    const [show, setShow] = useState(false);
    return (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #eee' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="primary">Net Banking</Typography>
                <IconButton size="small" onClick={() => setShow(!show)}>
                    {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                    <Typography variant="caption" color="text.secondary">User ID</Typography>
                    <Typography variant="body2" fontWeight="medium">{account.netbankingUser || '-'}</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary">Login Password</Typography>
                    <Typography variant="body2" fontWeight="medium">
                        {show && account.netbankingPasswordEncrypted ? decryptSensitive(account.netbankingPasswordEncrypted) : '••••••'}
                    </Typography>
                </Box>
                {account.profilePasswordEncrypted && (
                    <Box sx={{ gridColumn: 'span 2' }}>
                        <Typography variant="caption" color="text.secondary">Profile Password</Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {show ? decryptSensitive(account.profilePasswordEncrypted) : '••••••'}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}



