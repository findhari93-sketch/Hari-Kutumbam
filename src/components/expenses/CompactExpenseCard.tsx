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
    categoryColor?: string; // New Prop
    onClick: (expense: Expense) => void;
}

export default function CompactExpenseCard({ expense, categoryColor, onClick }: CompactExpenseCardProps) {
    const dateObj = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
    const isFailed = false;

    return (
        <Box
            onClick={() => onClick(expense)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                py: 1.5,
                px: 1,
                cursor: 'pointer',
                bgcolor: 'transparent',
                '&:active': { bgcolor: 'action.hover' },
                transition: 'background-color 0.2s',
                borderRadius: 1
            }}
        >
            {/* Avatar / Icon */}
            <Avatar
                variant="rounded"
                sx={{
                    bgcolor: isFailed ? 'error.light' : (categoryColor || 'background.paper'), // Use prop color
                    color: isFailed ? 'error.main' : (categoryColor ? 'common.white' : 'primary.main'), // White icon on color
                    width: 42,
                    height: 42,
                    mr: 2,
                    borderRadius: 3,
                    boxShadow: categoryColor ? 2 : 1
                }}
            >
                {getIcon(expense.category)}
            </Avatar>

            {/* Middle Content */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden', mr: 1 }}>
                <Typography variant="body1" fontWeight="600" noWrap sx={{ lineHeight: 1.2, mb: 0.3 }}>
                    {expense.description || expense.category}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {format(dateObj, 'd MMM')} • {expense.category}
                </Typography>
            </Box>

            {/* Right Side: Amount */}
            <Box sx={{ textAlign: 'right', minWidth: 70 }}>
                <Typography variant="subtitle1" fontWeight="700" sx={{ color: 'text.primary', letterSpacing: -0.2 }}>
                    ₹{expense.amount.toLocaleString()}
                </Typography>
                {isFailed && (
                    <Typography variant="caption" color="error">Failed</Typography>
                )}
            </Box>
        </Box>
    );
}
