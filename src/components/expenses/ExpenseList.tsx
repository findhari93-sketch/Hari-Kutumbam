'use client';
import React, { useMemo } from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import { Expense } from '@/types';
import CompactExpenseCard from './CompactExpenseCard';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface ExpenseListProps {
    expenses: Expense[];
    onGroupClick?: (groupKey: string) => void; // Optional expansion logic
    onItemClick: (expense: Expense) => void;
}

export default function ExpenseList({ expenses, onItemClick }: ExpenseListProps) {

    // Group expenses by "Month Year" (e.g., "January 2026")
    const grouped = useMemo(() => {
        const groups: Record<string, { total: number; items: Expense[]; sortDate: number }> = {};

        expenses.forEach(expense => {
            const date = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
            const key = format(date, 'MMMM yyyy'); // e.g., "January 2026"

            if (!groups[key]) {
                const sortDate = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
                groups[key] = { total: 0, items: [], sortDate };
            }
            groups[key].items.push(expense);
            groups[key].total += expense.amount;
        });

        // Convert to array and sort by date descending
        return Object.entries(groups)
            .map(([key, data]) => ({ key, ...data }))
            .sort((a, b) => b.sortDate - a.sortDate);
    }, [expenses]);

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
                const splitKey = group.key.split(' '); // ["January", "2026"]
                const month = splitKey[0];
                const year = splitKey[1];

                return (
                    <Box key={group.key} sx={{ mb: 2 }}>
                        {/* Group Header - Sticky */}
                        {/* Note: Top offset depends on the main header height. 
                            If main header is ~180px, we set it there. 
                            For now using a safe large value or disabling sticky if complex.
                            Let's try 170px which is approx header height + topbar.
                        */}
                        <Box sx={{
                            position: 'sticky',
                            top: { xs: 170, md: 180 },
                            zIndex: 5,
                            bgcolor: 'background.default',
                            py: 1,
                            px: 2, // Match page padding
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px dashed',
                            borderColor: 'divider',
                            mb: 1
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography variant="h6" fontWeight="800" color="text.primary">
                                    {month}
                                </Typography>
                                <Typography variant="caption" fontWeight="600" color="text.secondary">
                                    {year}
                                </Typography>
                            </Box>
                            <Typography variant="subtitle2" fontWeight="700" color="text.secondary">
                                ₹{group.total.toLocaleString()}
                            </Typography>
                        </Box>

                        {/* List Items */}
                        <Stack spacing={0} sx={{ px: 2 }}> {/* Add padding here for items */}
                            {group.items.map((expense, index) => (
                                <Box key={expense.id}>
                                    <CompactExpenseCard
                                        expense={expense}
                                        onClick={onItemClick}
                                    />
                                    {/* Divider between items, but not last one */}
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
