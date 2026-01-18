'use client';
import React, { useMemo } from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import { Expense, Income } from '@/types';
import CompactExpenseCard from './CompactExpenseCard';
import { format, getWeek, getYear, startOfWeek, endOfWeek } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface ExpenseListProps {
    expenses: Expense[];
    incomes?: Income[];
    onGroupClick?: (groupKey: string) => void;
    onItemClick: (expense: Expense) => void;
}

// Color Palette for Categories
const CATEGORY_COLORS: Record<string, string> = {
    'Food': '#FF5722', // Deep Orange
    'Milk': '#2196F3', // Blue
    'Transport': '#FFC107', // Amber
    'Utilities': '#9C27B0', // Purple
    'Family': '#4CAF50', // Green
    'Medical': '#F44336', // Red
    'Shopping': '#E91E63', // Pink
    'Entertainment': '#673AB7', // Deep Purple
    'Education': '#00BCD4', // Cyan
    'Clothing': '#E91E63', // Pink
    'Maintenance': '#795548', // Brown
    'Uncategorized': '#9E9E9E' // Grey
};

const getColor = (cat: string) => CATEGORY_COLORS[cat] || '#607D8B'; // Default BlueGrey

export default function ExpenseList({ expenses, incomes = [], onItemClick }: ExpenseListProps) {

    // Group logic: Weekly
    const grouped = useMemo(() => {
        const groups: Record<string, {
            expenseTotal: number;
            incomeTotal: number;
            items: Expense[];
            startDate: Date;
            endDate: Date;
        }> = {};

        // 1. Process Expenses
        expenses.forEach(expense => {
            const date = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
            const week = getWeek(date);
            const year = getYear(date);
            const key = `${year}-${week}`;

            if (!groups[key]) {
                groups[key] = {
                    expenseTotal: 0,
                    incomeTotal: 0,
                    items: [],
                    startDate: startOfWeek(date),
                    endDate: endOfWeek(date)
                };
            }
            groups[key].items.push(expense);
            groups[key].expenseTotal += expense.amount;
        });

        // 2. Process Incomes (only for Weekly totals)
        incomes.forEach(income => {
            const date = income.date instanceof Timestamp ? income.date.toDate() : new Date(income.date);
            const week = getWeek(date);
            const year = getYear(date);
            const key = `${year}-${week}`;

            if (groups[key]) {
                groups[key].incomeTotal += income.amount;
            }
        });

        // Convert to array and sort by date descending
        return Object.entries(groups)
            .map(([key, data]) => ({ key, ...data }))
            .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    }, [expenses, incomes]);

    if (grouped.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                <Typography>No expenses found.</Typography>
            </Box>
        );
    }

    return (
        <Stack spacing={0.5} sx={{ pb: 10 }}>
            {grouped.map((group) => {
                const balance = group.incomeTotal - group.expenseTotal;
                const weekNum = getWeek(group.startDate);

                return (
                    <Box key={group.key} sx={{ mb: 2 }}>
                        {/* Group Header - Sticky */}
                        <Box sx={{
                            position: 'sticky',
                            top: { xs: 100, md: 110 }, // Reduced from 170/180 to avoid gap. Let it slide under header if needed.
                            zIndex: 5,
                            bgcolor: 'background.default',
                            py: 1,
                            px: 2,
                            borderBottom: '1px dashed',
                            borderColor: 'divider',
                            mb: 1
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="subtitle2" fontWeight="800" color="text.primary" sx={{ textTransform: 'uppercase' }}>
                                    WEEK {weekNum}
                                </Typography>
                                <Typography variant="subtitle2" fontWeight="700" color="error.main">
                                    Σ -₹{group.expenseTotal.toLocaleString()}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                    {format(group.startDate, 'dd MMM')} - {format(group.endDate, 'dd MMM yyyy')}
                                </Typography>
                                {/* Balance (Income - Expense for this week) */}
                                <Typography variant="caption" fontWeight="600" color={balance >= 0 ? "success.main" : "error.main"}>
                                    Balance {balance >= 0 ? '+' : ''}₹{balance.toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>

                        {/* List Items */}
                        <Stack spacing={0} sx={{ px: 2 }}>
                            {group.items.map((expense, index) => (
                                <Box key={expense.id}>
                                    <CompactExpenseCard
                                        expense={expense}
                                        onClick={onItemClick}
                                        categoryColor={getColor(expense.category)} // Pass color
                                    />
                                    {index < group.items.length - 1 && <Divider sx={{ my: 0, ml: 8, mr: 0, borderStyle: 'dashed' }} />}
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                );
            })}
        </Stack>
    );
}
