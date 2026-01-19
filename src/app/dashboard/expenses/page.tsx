'use client';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Fab,
    Paper,
    TextField,
    InputAdornment,
    Container,
    CircularProgress,
    Chip,
    Drawer,
    IconButton,
    Grid,
    Divider,
    useTheme,
    useMediaQuery,
    AppBar,
    Toolbar,
    Slide
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Transition = React.forwardRef(function Transition(
    props: any,
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

import ExpenseTable from '@/components/expenses/ExpenseTable';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseDetailModal from '@/components/expenses/ExpenseDetailModal';
import BottomDateFilter from '@/components/expenses/BottomDateFilter';

import { useSearchParams } from 'next/navigation';
import { Expense, Income } from '@/types';
import { expenseService } from '@/services/expenseService';
import { incomeService } from '@/services/incomeService';
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { isWithinInterval, endOfMonth } from 'date-fns';
import { Range } from 'react-date-range';

// Filter Chip Categories
const FILTER_CATEGORIES = ['All', 'Food', 'Milk', 'Transport', 'Utilities', 'Family', 'Medical', 'Shopping', 'Entertainment', 'Maintenance', 'Education'];

export default function ExpensesPage() {
    return (
        <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
            <ExpensesContent />
        </React.Suspense>
    );
}

function ExpensesContent() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchOpen, setSearchOpen] = useState(false);
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

    // Date Range State
    // Default to Last 30 Days (standard useful view) or All Time?
    // User screenshot `uploaded_image_0` shows "Week 2... Week 1" which implies recent.
    // Let's default to '30D' for a focused view, or '12W' per screenshot.
    const [activeDatePreset, setActiveDatePreset] = useState<string>('30D');
    const [dateRange, setDateRange] = useState<Range>({
        startDate: new Date(), // Placeholder, updated in effect
        endDate: new Date(),
        key: 'selection'
    });

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [openDetailModal, setOpenDetailModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'single' | 'multi'; ids: string[] }>({
        open: false,
        type: 'single',
        ids: []
    });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleDatePreset = (days: number, presetCode: string) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setDateRange({ startDate: start, endDate: end, key: 'selection' });
        setActiveDatePreset(presetCode);
        setFilterDrawerOpen(false); // Close drawer after selection
    };

    // Initialize default filter
    useEffect(() => {
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setDateRange({ startDate: start, endDate: new Date(), key: 'selection' });
    }, []);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Re-filter
    useEffect(() => {
        applyFilter();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expenses, dateRange, searchTerm, activeCategory]);

    // Check for shared intent
    const searchParams = useSearchParams();
    useEffect(() => {
        if (searchParams.get('shared') === 'true' || searchParams.get('description')) {
            setEditingExpense(null);
            setOpenModal(true);
        }
    }, [searchParams]);

    const fetchData = async () => {
        if (!user) return;
        try {
            const [expenseList, incomeList] = await Promise.all([
                expenseService.getAllExpenses(user.uid),
                incomeService.getAllIncomes(user.uid)
            ]);

            const activeExpenses = expenseList.filter(e => !e.isDeleted);

            const mappedExpenses = activeExpenses.map(e => ({
                ...e,
                date: e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date)
            }));
            mappedExpenses.sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime());

            const mappedIncomes = incomeList.map(i => ({
                ...i,
                date: i.date instanceof Timestamp ? i.date.toDate() : new Date(i.date)
            }));

            setExpenses(mappedExpenses);
            setIncomes(mappedIncomes);
        } catch (error) {
            console.error("Failed to load data", error);
        }
    };

    const applyFilter = () => {
        let result = expenses;

        // 1. Date Filter
        if (dateRange.startDate && dateRange.endDate) {
            result = result.filter(e => {
                const d = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
                return isWithinInterval(d, {
                    start: dateRange.startDate!,
                    end: dateRange.endDate!
                });
            });
        }

        // 2. Category Filter
        if (activeCategory !== 'All') {
            result = result.filter(e => e.category === activeCategory);
        }

        // 3. Search Filter
        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(e =>
                e.category.toLowerCase().includes(lowerSearch) ||
                (e.description && e.description.toLowerCase().includes(lowerSearch)) ||
                e.amount.toString().includes(lowerSearch)
            );
        }

        setFilteredExpenses(result);
    };

    const handleSave = async (data: Partial<Expense>) => {
        if (!user) return;
        try {
            const payload = {
                amount: 0,
                category: 'Uncategorized',
                source: 'My Money',
                description: '',
                ...data,
                date: data.date instanceof Date ? Timestamp.fromDate(data.date) : (data.date || Timestamp.now()),
            } as Omit<Expense, 'id' | 'audit' | 'userId'>;

            if (editingExpense?.id) {
                await expenseService.updateExpense(editingExpense.id, payload, user);
            } else {
                await expenseService.addExpense(payload, user);
            }
            setOpenModal(false);
            setEditingExpense(null);
            fetchData();
        } catch (error) {
            console.error("Save error", error);
        }
    };

    const confirmDelete = async () => {
        if (!user) return;
        try {
            if (deleteConfirm.type === 'single' && deleteConfirm.ids[0]) {
                await expenseService.deleteExpense(deleteConfirm.ids[0], user);
            } else if (deleteConfirm.type === 'multi') {
                await expenseService.deleteExpenses(deleteConfirm.ids, user);
            }
            fetchData();
            setDeleteConfirm({ ...deleteConfirm, open: false });
            setOpenDetailModal(false);
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setOpenModal(true);
    };

    const handleCreate = () => {
        setEditingExpense(null);
        setOpenModal(true);
    };

    const handleListItemClick = (expense: Expense) => {
        setSelectedExpense(expense);
        setOpenDetailModal(true);
    };

    const totalSpend = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const getPresetLabel = (preset: string) => {
        const map: Record<string, string> = {
            '7D': 'Last 7 Days',
            '30D': 'Last 30 Days',
            '12W': 'Last 12 Weeks',
            '6M': 'Last 6 Months',
            '1Y': 'Last 1 Year'
        };
        return map[preset] || 'Custom';
    };

    return (
        <Box sx={{ pb: 10, bgcolor: 'background.default', minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Header Area */}
            <Paper
                elevation={0}
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                    borderRadius: 0,
                    bgcolor: 'background.paper'
                }}
            >
                <Box sx={{ px: 2, py: 1.5 }}>
                    {/* Collapsible Search Row */}
                    {!searchOpen ? (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    Total Spent
                                    {activeDatePreset && (
                                        <Box component="span" sx={{ px: 1, py: 0.25, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 4, fontSize: '0.65rem' }}>
                                            {getPresetLabel(activeDatePreset)}
                                        </Box>
                                    )}
                                </Typography>
                                <Typography variant="h5" fontWeight="800" sx={{ color: 'primary.main', lineHeight: 1.1, mt: 0.5 }}>
                                    ₹{totalSpend.toLocaleString()}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton onClick={() => setSearchOpen(true)} size="small" sx={{ color: 'text.secondary' }}>
                                    <SearchIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                fullWidth
                                autoFocus
                                size="small"
                                placeholder="Search expenses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                                    sx: { borderRadius: 3, bgcolor: 'action.hover', border: 'none' }
                                }}
                                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                            />
                            <IconButton onClick={() => { setSearchOpen(false); setSearchTerm(''); }} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    )}
                </Box>

                {/* Filter Chips */}
                <Box
                    sx={{
                        display: 'flex',
                        overflowX: 'auto',
                        gap: 1,
                        px: 2,
                        pb: 1.5,
                        '::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none',
                        '& .MuiChip-root': { flexShrink: 0, fontWeight: 500 }
                    }}
                >
                    {FILTER_CATEGORIES.map(cat => (
                        <Chip
                            key={cat}
                            label={cat}
                            clickable
                            size="small"
                            color={activeCategory === cat ? "primary" : "default"}
                            variant={activeCategory === cat ? "filled" : "outlined"}
                            onClick={() => setActiveCategory(cat)}
                            sx={{
                                border: activeCategory !== cat ? '1px solid' : 'none',
                                borderColor: 'divider',
                                borderRadius: 1.5
                            }}
                        />
                    ))}
                </Box>
            </Paper>

            {/* Bottom Date Filter (Fixed Bar) */}
            <BottomDateFilter
                currentPreset={activeDatePreset}
                onSelectPreset={(preset) => {
                    const daysMap: Record<string, number> = { '7D': 7, '30D': 30, '12W': 84, '6M': 180, '1Y': 365 };
                    if (daysMap[preset]) handleDatePreset(daysMap[preset], preset);
                }}
            />


            {/* Content Area */}
            <Box sx={{ p: 0 }}>
                {viewMode === 'list' ? (
                    <ExpenseList
                        expenses={filteredExpenses}
                        incomes={incomes}
                        onItemClick={handleListItemClick}
                    />
                ) : (
                    <Container maxWidth="lg" sx={{ py: 2 }}>
                        <ExpenseTable
                            expenses={filteredExpenses}
                            onEdit={handleEdit}
                            onDelete={(id) => setDeleteConfirm({ open: true, type: 'single', ids: [id] })}
                            onDeleteRows={(ids) => setDeleteConfirm({ open: true, type: 'multi', ids })}
                        />
                    </Container>
                )}
            </Box>

            {/* FAB */}
            <Fab
                color="primary"
                aria-label="add"
                sx={{
                    position: 'fixed',
                    bottom: { xs: 80, md: 32 },
                    right: { xs: 20, md: 32 },
                    boxShadow: 4
                }}
                onClick={handleCreate}
            >
                <AddIcon />
            </Fab>

            {/* Add/Edit Modal */}
            <Dialog
                open={openModal}
                onClose={() => setOpenModal(false)}
                fullWidth
                maxWidth="sm"
                fullScreen={isMobile}
                TransitionComponent={isMobile ? Transition : undefined}
            >
                {isMobile ? (
                    <AppBar sx={{ position: 'relative' }} elevation={0}>
                        <Toolbar>
                            <IconButton
                                edge="start"
                                color="inherit"
                                onClick={() => setOpenModal(false)}
                                aria-label="close"
                            >
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                                {editingExpense ? 'Edit Expense' : 'New Expense'}
                            </Typography>
                        </Toolbar>
                    </AppBar>
                ) : (
                    <DialogTitle sx={{ fontWeight: 'bold' }}>{editingExpense ? 'Edit Expense' : 'New Expense'}</DialogTitle>
                )}
                <DialogContent>
                    <Box pt={isMobile ? 2 : 1}>
                        <ExpenseForm
                            initialData={editingExpense}
                            onSave={handleSave}
                            onCancel={() => setOpenModal(false)}
                        />
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Detail View Modal */}
            <ExpenseDetailModal
                open={openDetailModal}
                onClose={() => setOpenDetailModal(false)}
                expense={selectedExpense}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteConfirm({ open: true, type: 'single', ids: [id] })}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        {deleteConfirm.type === 'single'
                            ? "Are you sure you want to delete this expense?"
                            : `Are you sure you want to delete ${deleteConfirm.ids.length} expenses?`}
                        This action has been audited.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
}
