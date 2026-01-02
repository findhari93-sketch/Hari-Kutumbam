'use client';
import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    InputAdornment
} from '@mui/material';
import { Income, IncomeSource } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface IncomeFormProps {
    initialData?: Income | null;
    onSave: (data: Partial<Income>) => Promise<void>;
    onCancel: () => void;
}

const INCOME_SOURCES: IncomeSource[] = ['Salary', 'Business', 'Rent', 'Interest', 'Dividend', 'Gift', 'Refund', 'Other'];

export default function IncomeForm({ initialData, onSave, onCancel }: IncomeFormProps) {
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState<string | number>('');
    const [source, setSource] = useState<IncomeSource>('Salary');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (initialData) {
            setAmount(initialData.amount);
            setSource(initialData.source);
            const d = initialData.date instanceof Timestamp
                ? initialData.date.toDate()
                : new Date(initialData.date);
            setDate(d.toISOString().split('T')[0]);
            setDescription(initialData.description);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                amount: Number(amount),
                source,
                date: new Date(date),
                description,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
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

            <FormControl fullWidth required>
                <InputLabel>Source</InputLabel>
                <Select
                    value={source}
                    label="Source"
                    onChange={(e) => setSource(e.target.value as IncomeSource)}
                >
                    {INCOME_SOURCES.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Date"
                type="date"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                required
            />

            <TextField
                label="Description"
                multiline
                rows={2}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button onClick={onCancel} disabled={loading}>Cancel</Button>
                <Button variant="contained" type="submit" disabled={loading}>
                    {initialData ? 'Update' : 'Save'}
                </Button>
            </Box>
        </Box>
    );
}
