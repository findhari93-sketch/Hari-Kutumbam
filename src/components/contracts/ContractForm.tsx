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
    FormControlLabel,
    Switch,
    CircularProgress,
    Typography
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Contract, ContractType } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface ContractFormProps {
    initialData?: Contract | null;
    onSave: (data: Partial<Contract>, file?: File) => Promise<void>;
    onCancel: () => void;
}

const CONTRACT_TYPES: ContractType[] = ['Rent', 'Insurance', 'AMC', 'Warranty', 'Other'];

export default function ContractForm({ initialData, onSave, onCancel }: ContractFormProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [type, setType] = useState<ContractType>('Other');
    const [provider, setProvider] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [expiryDate, setExpiryDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [reminderEnabled, setReminderEnabled] = useState(true);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setType(initialData.type);
            setProvider(initialData.provider);
            const start = initialData.startDate instanceof Timestamp ? initialData.startDate.toDate() : new Date(initialData.startDate);
            const expiry = initialData.expiryDate instanceof Timestamp ? initialData.expiryDate.toDate() : new Date(initialData.expiryDate);
            setStartDate(start.toISOString().split('T')[0]);
            setExpiryDate(expiry.toISOString().split('T')[0]);
            setDescription(initialData.description || '');
            setReminderEnabled(initialData.reminderEnabled);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                title,
                type,
                provider,
                startDate: new Date(startDate),
                expiryDate: new Date(expiryDate),
                description,
                reminderEnabled
            }, file || undefined);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>

            <TextField
                label="Contract Title"
                fullWidth
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                    value={type}
                    label="Type"
                    onChange={(e) => setType(e.target.value as ContractType)}
                >
                    {CONTRACT_TYPES.map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Provider / Entity Name"
                fullWidth
                required
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Landlord Name, LIC, Samsung"
            />

            <Box display="flex" gap={2}>
                <TextField
                    label="Start Date"
                    type="date"
                    fullWidth
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    required
                />
                <TextField
                    label="Expiry Date"
                    type="date"
                    fullWidth
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    required
                    error={new Date(expiryDate) < new Date(startDate)}
                    helperText={new Date(expiryDate) < new Date(startDate) ? "Expiry before start" : ""}
                />
            </Box>

            <TextField
                label="Description / Notes"
                multiline
                rows={2}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <FormControlLabel
                control={<Switch checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} />}
                label="Enable Expiry Reminder"
            />

            <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ borderStyle: 'dashed', py: 2 }}
            >
                {file ? file.name : (initialData?.documentUrl ? 'Change Document' : 'Upload Document (Image/PDF)')}
                <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
            </Button>
            {initialData?.documentUrl && !file && (
                <Typography variant="caption" align="center" display="block">
                    <a href={initialData.documentUrl} target="_blank" rel="noreferrer">View Current Document</a>
                </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button onClick={onCancel} disabled={loading}>Cancel</Button>
                <Button variant="contained" type="submit" disabled={loading} startIcon={loading && <CircularProgress size={20} color="inherit" />}>
                    {initialData ? 'Update' : 'Save'}
                </Button>
            </Box>
        </Box>
    );
}
