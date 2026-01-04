'use client';
import React, { useMemo } from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import { Expense } from '@/types';
import CompactExpenseCard from './CompactExpenseCard';
import { format, isSameYear } from 'date-fns';
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
        <Stack spacing={2} sx={{ pb: 10 }}>
            {grouped.map((group) => {
                const splitKey = group.key.split(' '); // ["January", "2026"]
                const month = splitKey[0];
                const year = splitKey[1];
                const isCurrentYear = isSameYear(new Date(), new Date(parseInt(year), 0, 1));

                return (
                    <Box key={group.key}>
                        {/* Group Header */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            mb: 1,
                            px: 1,
                            mt: 2
                        }}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1 }}>
                                    {month}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                    {year}
                                </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="bold" color="text.primary">
                                ₹{group.total.toLocaleString()}
                            </Typography>
                        </Box>

                        {/* List Items */}
                        <Box sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.6)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 4,
                            overflow: 'hidden'
                        }}>
                            {group.items.map((expense) => (
                                <CompactExpenseCard
                                    key={expense.id}
                                    expense={expense}
                                    onClick={onItemClick}
                                />
                            ))}
                        </Box>
                    </Box>
                );
            })}
        </Stack>
    );
}
