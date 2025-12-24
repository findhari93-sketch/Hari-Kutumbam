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
    Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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

    // Re-filter when date range or expenses change
    useEffect(() => {
        applyFilter();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expenses, dateRange]);

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
        if (!dateRange.startDate || !dateRange.endDate) {
            setFilteredExpenses(expenses);
            return;
        }

        const filtered = expenses.filter(e => {
            const d = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
            return isWithinInterval(d, {
                start: dateRange.startDate!,
                end: dateRange.endDate!
            });
        });
        setFilteredExpenses(filtered);
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
        <Box sx={{ pb: 10 }}>
            {/* Sticky Header */}
            <Paper elevation={0} square sx={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box>
                    <Typography variant="caption" color="text.secondary">Total Spend</Typography>
                    <Typography variant="h5" fontWeight="bold">₹{totalSpend.toLocaleString()}</Typography>
                </Box>
                <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />
            </Paper>

            {/* Table View */}
            <Box sx={{ p: 2 }}>
                <ExpenseTable
                    expenses={filteredExpenses}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Box>

            {/* FAB */}
            <Fab
                color="primary"
                aria-label="add"
                sx={{
                    position: 'fixed',
                    bottom: { xs: 80, md: 32 },
                    right: { xs: 16, md: 32 },
                    opacity: 0.6,
                    transition: 'opacity 0.3s',
                    '&:hover': { opacity: 1 }
                }}
                onClick={handleCreate}
            >
                <AddIcon />
            </Fab>

            {/* Add/Edit Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingExpense ? 'Edit Expense' : 'New Expense'}</DialogTitle>
                <DialogContent>
                    <ExpenseForm
                        initialData={editingExpense}
                        onSave={handleSave}
                        onCancel={() => setOpenModal(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
}
