'use client';
import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { Expense } from '@/types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Icons
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import CommuteIcon from '@mui/icons-material/Commute';
import BoltIcon from '@mui/icons-material/Bolt';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PaidIcon from '@mui/icons-material/Paid';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import BuildIcon from '@mui/icons-material/Build'; // Maintenance/Repair
import SchoolIcon from '@mui/icons-material/School'; // Education
import CheckroomIcon from '@mui/icons-material/Checkroom'; // Clothes
import MovieIcon from '@mui/icons-material/Movie'; // Entertainment

const getIcon = (category: string) => {
    const map: Record<string, React.ReactNode> = {
        'Food': <RestaurantIcon fontSize="small" />,
        'Milk': <LocalDrinkIcon fontSize="small" />,
        'Transport': <CommuteIcon fontSize="small" />,
        'Utilities': <BoltIcon fontSize="small" />,
        'Family': <Diversity3Icon fontSize="small" />,
        'Medical': <LocalHospitalIcon fontSize="small" />,
        'Shopping': <ShoppingBagIcon fontSize="small" />,
        'Maintenance': <BuildIcon fontSize="small" />,
        'Education': <SchoolIcon fontSize="small" />,
        'Clothing': <CheckroomIcon fontSize="small" />,
        'Entertainment': <MovieIcon fontSize="small" />,
    };
    return map[category] || <PaidIcon fontSize="small" />;
};

interface CompactExpenseCardProps {
    expense: Expense;
    onClick: (expense: Expense) => void;
}

export default function CompactExpenseCard({ expense, onClick }: CompactExpenseCardProps) {
    const dateObj = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
    const isFailed = false; // expense.status check removed as it doesn't exist on type

    // Check if it's income or expense based on amount (legacy logic) or category type? 
    // Usually expense amount is positive in this app. 
    // We will assume standard expense.

    return (
        <Paper
            elevation={0}
            onClick={() => onClick(expense)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1.5,
                mb: 0.5,
                borderRadius: 3,
                bgcolor: 'transparent', // Make it blend or 'background.paper'
                '&:active': { bgcolor: 'action.hover' },
                cursor: 'pointer',
                transition: 'background-color 0.2s'
            }}
        >
            {/* Avatar / Icon */}
            <Avatar
                variant="rounded"
                sx={{
                    bgcolor: isFailed ? 'error.light' : 'primary.lighter',
                    color: isFailed ? 'error.main' : 'primary.main',
                    width: 40,
                    height: 40,
                    mr: 2,
                    borderRadius: '12px'
                }}
            >
                {getIcon(expense.category)}
            </Avatar>

            {/* Middle Content */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography variant="subtitle2" fontWeight="600" noWrap>
                    {expense.description || expense.category}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                    {format(dateObj, 'd MMMM')}
                    {/* If same year, maybe hide year. For now 'd MMMM' e.g. '3 January' */}
                </Typography>
            </Box>

            {/* Right Side: Amount */}
            <Box sx={{ textAlign: 'right', minWidth: 70 }}>
                <Typography variant="subtitle1" fontWeight="bold" color={isFailed ? 'text.disabled' : 'text.primary'}>
                    ₹{expense.amount.toLocaleString()}
                </Typography>
                {isFailed && (
                    <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        Failed
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}
