'use client';
import React from 'react';
import { Paper, Box, Typography, IconButton, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Expense } from '@/types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Maps categories to icons (simplified)
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import CommuteIcon from '@mui/icons-material/Commute';
import BoltIcon from '@mui/icons-material/Bolt';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PaidIcon from '@mui/icons-material/Paid';

const getIcon = (category: string) => {
    const map: any = {
        'Food': <RestaurantIcon />,
        'Milk': <LocalDrinkIcon />,
        'Transport': <CommuteIcon />,
        'Utilities': <BoltIcon />,
        'Family': <Diversity3Icon />,
        'Medical': <LocalHospitalIcon />,
    };
    return map[category] || <PaidIcon />;
};

interface ExpenseCardProps {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
}

export default function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
    const dateObj = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);

    return (
        <Paper elevation={0} sx={{
            p: 2,
            display: 'flex',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            alignItems: 'center',
            gap: 2,
            transition: '0.2s',
            '&:active': { bgcolor: 'action.hover' }
        }}>
            <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {getIcon(expense.category)}
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {expense.category}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color={expense.amount > 0 ? 'error.main' : 'success.main'}>
                        ₹{expense.amount}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                    {expense.subcategory && (
                        <Chip label={expense.subcategory} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                        {format(dateObj, 'MMM d, yyyy')}
                    </Typography>
                </Box>

                {expense.description && (
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                        {expense.description}
                    </Typography>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <IconButton size="small" onClick={() => onEdit(expense)}>
                    <EditIcon fontSize="small" />
                </IconButton>
                {/* Delete could be hidden or behind a swipe in future */}
                <IconButton size="small" color="error" onClick={() => onDelete(expense.id!)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
        </Paper>
    );
}
