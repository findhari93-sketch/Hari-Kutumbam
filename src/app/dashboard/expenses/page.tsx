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
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import TableChartIcon from '@mui/icons-material/TableChart';
import FilterListIcon from '@mui/icons-material/FilterList';

import ExpenseTable from '@/components/expenses/ExpenseTable';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseDetailModal from '@/components/expenses/ExpenseDetailModal';
import DateRangeFilter from '@/components/expenses/DateRangeFilter';

import { useRouter, useSearchParams } from 'next/navigation';
import { Expense } from '@/types';
import { expenseService } from '@/services/expenseService';
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { Range } from 'react-date-range';

// Filter Chip Categories
const FILTER_CATEGORIES = ['All', 'Food', 'Milk', 'Transport', 'Utilities', 'Family', 'Medical', 'Shopping', 'Entertainment'];

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
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // Date Range State
    const [dateRange, setDateRange] = useState<Range>({
        startDate: new Date(2020, 0, 1),
        endDate: endOfMonth(new Date()),
        key: 'selection'
    });

    // Modal State
    const [openModal, setOpenModal] = useState(false); // For Add/Edit Form
    const [openDetailModal, setOpenDetailModal] = useState(false); // For View Detail
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null); // For Detail View

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'single' | 'multi'; ids: string[] }>({
        open: false,
        type: 'single',
        ids: []
    });

    useEffect(() => {
        fetchExpenses();
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

    const fetchExpenses = async () => {
        if (!user) return;
        try {
            const data = await expenseService.getAllExpenses();
            // Filter deleted
            const activeExpenses = data.filter(e => !e.isDeleted);

            // Data mapping dates
            const mapped = activeExpenses.map(e => ({
                ...e,
                date: e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date)
            }));
            // Sort by date desc
            mapped.sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime());

            setExpenses(mapped);
        } catch (error) {
            console.error("Failed to load expenses", error);
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

        // 2. Category Filter (Chip)
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
            fetchExpenses();
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
            fetchExpenses();
            setDeleteConfirm({ ...deleteConfirm, open: false });
            setOpenDetailModal(false); // Close detail if deleting from there
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

    return (
        <Box sx={{ pb: 10, bgcolor: 'background.default', minHeight: '100vh' }}>
            {/* Header Area */}
            <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 10 }}>
                <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>

                    {/* Top Row: Title & Toggle */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -0.5 }}>
                                Expenses
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Total: <Box component="span" sx={{ color: 'text.primary', fontWeight: 'bold' }}>₹{totalSpend.toLocaleString()}</Box>
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* Date Filter Icon Trigger - simplified for mobile, keeps existing full component in logic */}
                            <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />

                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={(_, v) => v && setViewMode(v)}
                                size="small"
                                sx={{ height: 32 }}
                            >
                                <ToggleButton value="list">
                                    <ViewListIcon fontSize="small" />
                                </ToggleButton>
                                <ToggleButton value="table">
                                    <TableChartIcon fontSize="small" />
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Box>

                    {/* Search Bar */}
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 4, bgcolor: 'action.hover', border: 'none' }
                        }}
                        variant="outlined"
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        }}
                    />

                    {/* Filter Chips Scrollable */}
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            overflowX: 'auto',
                            pb: 1,
                            mx: -2,
                            px: 2,
                            '::-webkit-scrollbar': { display: 'none' },
                            scrollbarWidth: 'none'
                        }}
                    >
                        {FILTER_CATEGORIES.map(cat => (
                            <Chip
                                key={cat}
                                label={cat}
                                clickable
                                color={activeCategory === cat ? "primary" : "default"}
                                variant={activeCategory === cat ? "filled" : "outlined"}
                                onClick={() => setActiveCategory(cat)}
                                sx={{ fontWeight: 600 }}
                            />
                        ))}
                    </Stack>

                </Container>
            </Box>

            {/* Content Area */}
            <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
                {viewMode === 'list' ? (
                    <ExpenseList
                        expenses={filteredExpenses}
                        onItemClick={handleListItemClick}
                    />
                ) : (
                    <ExpenseTable
                        expenses={filteredExpenses}
                        onEdit={handleEdit}
                        onDelete={(id) => setDeleteConfirm({ open: true, type: 'single', ids: [id] })}
                        onDeleteRows={(ids) => setDeleteConfirm({ open: true, type: 'multi', ids })}
                    />
                )}
            </Container>

            {/* FAB */}
            <Fab
                color="primary"
                aria-label="add"
                sx={{
                    position: 'fixed',
                    bottom: { xs: 80, md: 32 },
                    right: { xs: 16, md: 32 },
                    boxShadow: 4
                }}
                onClick={handleCreate}
            >
                <AddIcon />
            </Fab>

            {/* Add/Edit Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>{editingExpense ? 'Edit Expense' : 'New Expense'}</DialogTitle>
                <DialogContent>
                    <Box pt={1}>
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
        </Box>
    );
}
