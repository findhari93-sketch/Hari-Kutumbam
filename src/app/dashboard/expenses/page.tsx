'use client';
import React from 'react';
import { Typography, Box } from '@mui/material';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import RecentTransactionsList from '@/components/expenses/RecentTransactionsList';

export default function ExpensesPage() {
    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Transactions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Left Column: Entry Form */}
                    <ExpenseForm />
                </Box>
                <Box sx={{ flex: 1.5, minWidth: 0 }}>
                    {/* Right Column: History */}
                    <Typography variant="h6" gutterBottom>
                        Recent Activity
                    </Typography>
                    <RecentTransactionsList />
                </Box>
            </Box>
        </Box>
    );
}
