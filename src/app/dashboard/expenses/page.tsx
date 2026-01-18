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
    Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

import ExpenseTable from '@/components/expenses/ExpenseTable';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseDetailModal from '@/components/expenses/ExpenseDetailModal';
import DateRangeFilter from '@/components/expenses/DateRangeFilter';

import { useSearchParams } from 'next/navigation';
import { Expense } from '@/types';
import { expenseService } from '@/services/expenseService';
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { isWithinInterval, endOfMonth } from 'date-fns';
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
            const data = await expenseService.getAllExpenses(user.uid);
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
        <Box sx={{ pb: 10, bgcolor: 'background.default', minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Header Area */}
            <Paper
                elevation={0}
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20, // Higher than list headers
                    borderRadius: 0,
                    bgcolor: 'background.paper'
                }}
            >
                <Box sx={{ px: 2, pt: 2, pb: 0 }}>
                    {/* Top Row: Total & Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" fontWeight="500">
                                Total Spent
                            </Typography>
                            <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: -0.5, mt: 0.5, color: 'primary.main' }}>
                                ₹{totalSpend.toLocaleString()}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1}>
                            <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />
                        </Stack>
                    </Box>

                    {/* Search Bar */}
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                                sx: {
                                    borderRadius: 3,
                                    bgcolor: 'action.hover',
                                    border: 'none',
                                    fontSize: '0.875rem',
                                    height: 40
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                            }}
                        />
                    </Box>
                </Box>

                {/* Filter Chips - Scrollable Row with full width bleeding */}
                <Box
                    sx={{
                        display: 'flex',
                        overflowX: 'auto',
                        gap: 1,
                        px: 2,
                        pb: 2,
                        // Hide scrollbar
                        '::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none',
                        '& .MuiChip-root': {
                            flexShrink: 0,
                            fontWeight: 500,
                        }
                    }}
                >
                    {FILTER_CATEGORIES.map(cat => (
                        <Chip
                            key={cat}
                            label={cat}
                            clickable
                            size="medium"
                            color={activeCategory === cat ? "primary" : "default"}
                            variant={activeCategory === cat ? "filled" : "outlined"}
                            onClick={() => setActiveCategory(cat)}
                            sx={{
                                border: activeCategory !== cat ? '1px solid' : 'none',
                                borderColor: 'divider',
                                borderRadius: 2
                            }}
                        />
                    ))}
                </Box>
            </Paper>

            {/* Content Area */}
            <Box sx={{ px: 0, py: 0 }}> {/* Remove padding for edge-to-edge feel on mobile, let list handle internal padding if needed */}
                {viewMode === 'list' ? (
                    <ExpenseList
                        expenses={filteredExpenses}
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
