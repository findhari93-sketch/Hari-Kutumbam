'use client';
import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Typography,
    Paper,
    Tabs,
    Tab,
    OutlinedInput,
    InputAdornment,
} from '@mui/material';
import { addTransaction, Transaction } from '@/services/firestore'; // We'll mock this for now or use the service
import { useAuth } from '@/context/AuthContext';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { parseScreenshot } from '@/services/ocr';
import { CircularProgress } from '@mui/material';

interface ExpenseFormProps {
    onSuccess?: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
    const { user } = useAuth();
    const [tabIndex, setTabIndex] = useState(0); // 0: Expense, 1: Income
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [paymentMode, setPaymentMode] = useState('online');
    const [isMothersMoney, setIsMothersMoney] = useState(false);
    const [bankAccount, setBankAccount] = useState(''); // Would come from context/db

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const type = tabIndex === 0 ? 'expense' : 'income';
            // In a real app we would call addTransaction here
            console.log('Submitting:', {
                amount, category, date, paymentMode, isMothersMoney, type
            });
            // await addTransaction(user.uid, { ... });

            setAmount('');
            setDescription('');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScanning(true);
            try {
                const data = await parseScreenshot(e.target.files[0]);
                if (data.amount) setAmount(data.amount);
                if (data.date) setDate(data.date);
                if (data.recipient) setDescription(`Paid to ${data.recipient}`);
            } catch (err) {
                console.error(err);
                alert('Failed to read screenshot');
            } finally {
                setScanning(false);
            }
        }
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
                {tabIndex === 0 ? 'Add New Expense' : 'Record Income'}
            </Typography>

            <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 3 }} variant="fullWidth">
                <Tab label="Expense" />
                <Tab label="Income" />
            </Tabs>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Screenshot Upload Placeholder (Task 8) */}
                {tabIndex === 0 && (
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={scanning ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                        fullWidth
                        sx={{ mb: 1, borderStyle: 'dashed', py: 2 }}
                        disabled={scanning}
                    >
                        {scanning ? 'Scanning Screenshot...' : 'Auto-Fill from GPay Screenshot'}
                        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                    </Button>
                )}

                <FormControl fullWidth required>
                    <InputLabel htmlFor="amount">Amount</InputLabel>
                    <OutlinedInput
                        id="amount"
                        startAdornment={<InputAdornment position="start">₹</InputAdornment>}
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl fullWidth required>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={category}
                            label="Category"
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {tabIndex === 0 ? [
                                <MenuItem key="food" value="food">Groceries/Food</MenuItem>,
                                <MenuItem key="milk" value="milk">Milk</MenuItem>,
                                <MenuItem key="transport" value="transport">Transport</MenuItem>,
                                <MenuItem key="utility" value="utility">Utilities (Web/Elec)</MenuItem>,
                                <MenuItem key="family" value="family">Family Expenses</MenuItem>,
                                <MenuItem key="other" value="other">Other</MenuItem>
                            ] : [
                                <MenuItem key="business" value="business">Business</MenuItem>,
                                <MenuItem key="salary" value="salary">Salary</MenuItem>,
                                <MenuItem key="rental" value="rental">Rental</MenuItem>,
                                <MenuItem key="gift" value="gift">Gift/Bonus</MenuItem>
                            ]}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Payment Mode</InputLabel>
                        <Select
                            value={paymentMode}
                            label="Payment Mode"
                            onChange={(e) => setPaymentMode(e.target.value)}
                        >
                            <MenuItem value="online">Online / UPI</MenuItem>
                            <MenuItem value="cash">Cash</MenuItem>
                            <MenuItem value="card">Card</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                />

                {tabIndex === 1 && (
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isMothersMoney}
                                onChange={(e) => setIsMothersMoney(e.target.checked)}
                            />
                        }
                        label="Is this Mother's Money?"
                    />
                )}

                <TextField
                    label="Description / Notes"
                    multiline
                    rows={2}
                    fullWidth
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mt: 1 }}
                >
                    {loading ? 'Saving...' : 'Save Transaction'}
                </Button>
            </Box>
        </Paper>
    );
}
