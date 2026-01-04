'use client';
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    IconButton,
    Stack,
    Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { Expense } from '@/types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Icons for detail view
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';

interface ExpenseDetailModalProps {
    open: boolean;
    onClose: () => void;
    expense: Expense | null;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
}

export default function ExpenseDetailModal({ open, onClose, expense, onEdit, onDelete }: ExpenseDetailModalProps) {
    if (!expense) return null;

    const dateObj = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: { borderRadius: 4, pb: 1 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h6" fontWeight="bold">Transaction Details</Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {/* Header Amount */}
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h3" fontWeight="bold" color="text.primary">
                        ₹{expense.amount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {format(dateObj, 'EEEE, d MMMM yyyy, h:mm a')}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2.5}>
                    {/* Category */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ bgcolor: 'primary.lighter', p: 1, borderRadius: 2, color: 'primary.main' }}>
                            <CategoryIcon />
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Category</Typography>
                            <Typography variant="body1" fontWeight="500">{expense.category}</Typography>
                        </Box>
                    </Box>

                    {/* Description */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 2, color: 'text.primary' }}>
                            <DescriptionIcon />
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Description</Typography>
                            <Typography variant="body1" fontWeight="500">
                                {expense.description || "No description"}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Payment Mode */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ bgcolor: 'success.lighter', p: 1, borderRadius: 2, color: 'success.main' }}>
                            <PaymentIcon />
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                            <Typography variant="body1" fontWeight="500">
                                {expense.paymentMode} {expense.source ? `• ${expense.source}` : ''}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Subcategory Chip */}
                    {expense.subcategory && (
                        <Box sx={{ pl: 7 }}>
                            <Chip label={expense.subcategory} size="small" />
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                        if (expense.id) onDelete(expense.id);
                        onClose();
                    }}
                    sx={{ borderRadius: 3, textTransform: 'none', px: 3 }}
                >
                    Delete
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => {
                        onEdit(expense);
                        onClose(); // Parent might want to transform to edit modal
                    }}
                    sx={{ borderRadius: 3, textTransform: 'none', px: 4 }}
                >
                    Edit
                </Button>
            </DialogActions>
        </Dialog>
    );
}
