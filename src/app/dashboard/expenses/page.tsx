'use client';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    Stack,
    Fab,
    Paper,
    TextField,
    InputAdornment,
    Container
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ExpenseTable from '@/components/expenses/ExpenseTable';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import DateRangeFilter from '@/components/expenses/DateRangeFilter';
import { Expense } from '@/types';
import { expenseService } from '@/services/expenseService';
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { Range } from 'react-date-range';

export default function ExpensesPage() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Date Range State
    const [dateRange, setDateRange] = useState<Range>({
        startDate: new Date(2020, 0, 1),
        endDate: endOfMonth(new Date()),
        key: 'selection'
    });

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    useEffect(() => {
        fetchExpenses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Re-filter when date range, search, or expenses change
    useEffect(() => {
        applyFilter();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expenses, dateRange, searchTerm]);

    const fetchExpenses = async () => {
        if (!user) return;
        try {
            const data = await expenseService.getAllExpenses();
            // Data mapping dates
            const mapped = data.map(e => ({
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

        // 2. Search Filter
        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(e =>
                e.category.toLowerCase().includes(lowerSearch) ||
                e.description.toLowerCase().includes(lowerSearch) ||
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

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (!confirm("Are you sure? This will be audited.")) return;
        try {
            await expenseService.deleteExpense(id, user);
            fetchExpenses();
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

    const totalSpend = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <Box sx={{ pb: 10, bgcolor: 'background.default', minHeight: '100vh' }}>
            {/* Header Area */}
            <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 10 }}>
                <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -0.5 }}>
                                Expenses
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Total Spend: <Box component="span" sx={{ color: 'text.primary', fontWeight: 'bold' }}>₹{totalSpend.toLocaleString()}</Box>
                            </Typography>
                        </Box>
                        <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />
                    </Box>

                    {/* Search Bar */}
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 3, bgcolor: 'action.hover' }
                        }}
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        }}
                    />
                </Container>
            </Box>

            {/* Content Area */}
            <Container maxWidth="lg" sx={{ px: { xs: 0, md: 3 }, py: 2 }}>
                <ExpenseTable
                    expenses={filteredExpenses}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
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
        </Box>
    );
}
