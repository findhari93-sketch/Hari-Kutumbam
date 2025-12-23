'use client';
import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    TextField,
    Select,
    MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { parseBankStatement, BankTransaction } from '@/services/pdfParser';
import { expenseService } from '@/services/expenseService';
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from 'firebase/firestore';

export default function ImportPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLoading(true);
            try {
                const data = await parseBankStatement(e.target.files[0]);
                setTransactions(data);
            } catch (error) {
                console.error("PDF Parse Error", error);
                alert("Failed to parse PDF. Please ensure it's a valid statement.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleImport = async () => {
        if (!user) return;
        setImporting(true);
        try {
            let count = 0;
            for (const txn of transactions) {
                await expenseService.addExpense({
                    amount: txn.amount,
                    date: Timestamp.fromDate(txn.date),
                    description: txn.description,
                    category: 'Uncategorized',
                    subcategory: '',
                    source: 'My Money',
                    type: txn.type,
                    paymentMode: txn.paymentMode || 'NetBanking',
                    transactionId: txn.transactionId || null,
                    userId: user.uid,
                    audit: {
                        createdBy: user.uid,
                        createdAt: Timestamp.now(),
                        updatedBy: user.uid,
                        updatedAt: Timestamp.now()
                    }
                } as unknown as Omit<import('@/types').Expense, 'id'>, user);
                count++;
            }
            alert(`Successfully imported ${count} transactions!`);
            setTransactions([]);
        } catch (error) {
            console.error("Import Error", error);
            alert("Error importing transactions");
        } finally {
            setImporting(false);
        }
    };

    const handleUpdateTransaction = (index: number, updated: BankTransaction) => {
        setTransactions(prev => {
            const copy = [...prev];
            copy[index] = updated;
            return copy;
        });
    };

    const handleRemove = (index: number) => {
        setTransactions(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Box sx={{ p: 2, pb: 10 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Import Statement</Typography>
                {transactions.length > 0 && (
                    <Button
                        color="error"
                        size="small"
                        onClick={() => setTransactions([])}
                    >
                        Clear
                    </Button>
                )}
            </Box>

            {transactions.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderWidth: 2, borderRadius: 2 }}>
                    <Button
                        variant="contained"
                        component="label"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? 'Parsing...' : 'Upload PDF'}
                        <input type="file" hidden accept="application/pdf" onChange={handleFileUpload} />
                    </Button>
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        Supports SBI & HDFC Formats
                    </Typography>
                </Paper>
            ) : (
                <>
                    {/* Horizontal Scrolling Table */}
                    <TableContainer component={Paper} sx={{ maxHeight: '75vh', overflowX: 'auto' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 20,
                                            bgcolor: 'background.paper',
                                            minWidth: 100,
                                            boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        Date
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 80 }}>Mode</TableCell>
                                    <TableCell sx={{ minWidth: 180 }}>Paid To / From</TableCell>
                                    <TableCell sx={{ minWidth: 80 }}>Type</TableCell>
                                    <TableCell align="right" sx={{ minWidth: 100 }}>Amount</TableCell>
                                    <TableCell align="center" sx={{ minWidth: 50 }}>X</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map((txn, index) => (
                                    <EditableRow
                                        key={index}
                                        transaction={txn}
                                        onUpdate={(t) => handleUpdateTransaction(index, t)}
                                        onDelete={() => handleRemove(index)}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Quick Import Button (Floating or Bottom) */}
                    <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        size="large"
                        startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        disabled={importing}
                        onClick={handleImport}
                        sx={{ mt: 2 }}
                    >
                        Import All ({transactions.length})
                    </Button>
                </>
            )}
        </Box>
    );
}

interface EditableRowProps {
    transaction: BankTransaction;
    onUpdate: (t: BankTransaction) => void;
    onDelete: () => void;
}

const EditableRow = ({ transaction, onUpdate, onDelete }: EditableRowProps) => {
    // Direct edit mode (always editing for this use case to be fast)
    const handleChange = (field: keyof BankTransaction, value: string | number | Date) => {
        onUpdate({ ...transaction, [field]: value });
    };

    return (
        <TableRow hover>
            {/* Sticky Date Column */}
            <TableCell
                sx={{
                    position: 'sticky',
                    left: 0,
                    bgcolor: 'background.paper',
                    zIndex: 10,
                    boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)'
                }}
            >
                <TextField
                    type="date"
                    value={transaction.date instanceof Date ? transaction.date.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('date', new Date(e.target.value))}
                    size="small"
                    variant="standard"
                    InputProps={{ disableUnderline: true, style: { fontSize: '0.85rem' } }}
                />
            </TableCell>

            {/* Mode */}
            <TableCell>
                <Select
                    value={transaction.paymentMode || 'NetBanking'}
                    onChange={(e) => handleChange('paymentMode', e.target.value)}
                    size="small"
                    variant="standard"
                    disableUnderline
                    sx={{ fontSize: '0.8rem' }}
                >
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                    <MenuItem value="NetBanking">NetBnkg</MenuItem>
                </Select>
            </TableCell>

            {/* Description / Payee */}
            <TableCell>
                <TextField
                    value={transaction.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    size="small"
                    fullWidth
                    variant="standard"
                    InputProps={{ disableUnderline: true, style: { fontSize: '0.85rem' } }}
                    placeholder="Payee Name"
                />
            </TableCell>

            {/* Type */}
            <TableCell>
                <Select
                    value={transaction.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    size="small"
                    variant="standard"
                    disableUnderline
                    sx={{
                        fontSize: '0.8rem',
                        color: transaction.type === 'income' ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                    }}
                >
                    <MenuItem value="expense">Exp</MenuItem>
                    <MenuItem value="income">Inc</MenuItem>
                </Select>
            </TableCell>

            {/* Amount */}
            <TableCell align="right">
                <TextField
                    type="number"
                    value={transaction.amount}
                    onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                    size="small"
                    variant="standard"
                    InputProps={{
                        disableUnderline: true,
                        style: { fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'right' }
                    }}
                    sx={{ width: 80 }}
                />
            </TableCell>

            <TableCell align="center">
                <IconButton size="small" color="error" onClick={onDelete}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </TableCell>
        </TableRow>
    );
};
