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
    InputAdornment,
    IconButton,
    Tooltip,
    ToggleButtonGroup,
    ToggleButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Autocomplete
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CircularProgress } from '@mui/material';
import { parseScreenshot } from '@/services/ocr';
import { Expense, Category } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { categoryService } from '@/services/categoryService';
import { useAuth } from '@/context/AuthContext';
import { get, del } from 'idb-keyval';
import { useRouter, useSearchParams } from 'next/navigation';

interface ExpenseFormProps {
    initialData?: Expense | null;
    onSave: (data: Partial<Expense>) => Promise<void>;
    onCancel: () => void;
}

export default function ExpenseForm({ initialData, onSave, onCancel }: ExpenseFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form State
    const [amount, setAmount] = useState<string | number>('');
    const [categoryName, setCategoryName] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [source, setSource] = useState<'My Money' | 'Wife Money' | 'Mother Money'>('My Money');

    // New Fields
    const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'NetBanking'>('Cash');
    const [transactionId, setTransactionId] = useState('');
    const [googleTransactionId, setGoogleTransactionId] = useState('');
    const [senderName, setSenderName] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [bankName, setBankName] = useState('');

    useEffect(() => {
        if (user) {
            categoryService.getUserCategories(user.uid).then(setCategories);
        }
    }, [user]);

    // Check for Shared File (Web Share Target)
    useEffect(() => {
        const checkSharedFile = async () => {
            const isShared = searchParams.get('shared');
            if (isShared) {
                try {
                    setScanning(true);
                    const file = await get('shared-file');
                    if (file && file instanceof File) {
                        await processFile(file);
                        await del('shared-file');

                        // Clean URL
                        router.replace('/dashboard/expenses', { scroll: false });
                    }
                } catch (err) {
                    console.error('Error processing shared file:', err);
                } finally {
                    setScanning(false);
                }
            }
        };

        checkSharedFile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const processFile = async (file: File) => {
        try {
            const data = await parseScreenshot(file);

            if (data.amount) setAmount(data.amount);
            if (data.date) setDate(data.date.split('T')[0]);
            if (data.description) setDescription(data.description);

            if (data.paymentMode) setPaymentMode(data.paymentMode);
            if (data.transactionId) setTransactionId(data.transactionId);
            if (data.googleTransactionId) setGoogleTransactionId(data.googleTransactionId);
            if (data.senderName) setSenderName(data.senderName);
            if (data.receiverName) setReceiverName(data.receiverName);
            if (data.bankName) setBankName(data.bankName);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (initialData) {
            setAmount(initialData.amount);
            setCategoryName(initialData.category);
            setSubcategory(initialData.subcategory || '');
            setDescription(initialData.description);
            setSource(initialData.source);

            // Format Date
            const d = initialData.date instanceof Timestamp
                ? initialData.date.toDate()
                : new Date(initialData.date);
            // Handle ISO string from OCR which might have time
            setDate(d.toISOString().split('T')[0]);

            // New Fields
            if (initialData.paymentMode) setPaymentMode(initialData.paymentMode);
            if (initialData.transactionId) setTransactionId(initialData.transactionId);
            if (initialData.googleTransactionId) setGoogleTransactionId(initialData.googleTransactionId);
            if (initialData.senderName) setSenderName(initialData.senderName);
            if (initialData.receiverName) setReceiverName(initialData.receiverName);
            if (initialData.bankName) setBankName(initialData.bankName);
        }
    }, [initialData]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                amount: Number(amount),
                category: categoryName,
                subcategory,
                description,
                source,
                date: new Date(date),

                // New Fields
                paymentMode,
                transactionId,
                googleTransactionId,
                senderName,
                receiverName,
                bankName
            });
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
                await processFile(e.target.files[0]);
            } catch (err) {
                console.error(err);
            } finally {
                setScanning(false);
            }
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>

            {!initialData && (
                <Button
                    variant="outlined"
                    component="label"
                    startIcon={scanning ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    fullWidth
                    sx={{ mb: 1, borderStyle: 'dashed', py: 2 }}
                    disabled={scanning}
                >
                    {scanning ? 'Scanning...' : 'Auto-Fill from Screenshot'}
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>
            )}

            {/* Payment Mode Selector at Top */}
            <ToggleButtonGroup
                color="primary"
                value={paymentMode}
                exclusive
                onChange={(_, val) => val && setPaymentMode(val)}
                fullWidth
                size="small"
            >
                <ToggleButton value="Cash">Cash</ToggleButton>
                <ToggleButton value="UPI">UPI</ToggleButton>
                <ToggleButton value="Card">Card</ToggleButton>
                <ToggleButton value="NetBanking">NetBnkg</ToggleButton>
            </ToggleButtonGroup>

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

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Autocomplete
                    value={
                        // Current value object
                        categories.flatMap(c => [
                            { label: c.name, category: c.name, subcategory: '' },
                            ...c.subcategories.map(sub => ({ label: `${c.name} > ${sub}`, category: c.name, subcategory: sub }))
                        ]).find(o => o.category === categoryName && o.subcategory === subcategory) || null
                    }
                    onChange={(event, newValue) => {
                        if (newValue) {
                            setCategoryName(newValue.category);
                            setSubcategory(newValue.subcategory);
                        } else {
                            // User cleared input
                            setCategoryName('');
                            setSubcategory('');
                        }
                    }}
                    options={categories.flatMap(c => [
                        // Option for just the category
                        { label: c.name, category: c.name, subcategory: '' },
                        // Options for each subcategory
                        ...c.subcategories.map(sub => ({
                            label: `${c.name} > ${sub}`,
                            category: c.name,
                            subcategory: sub
                        }))
                    ])}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                        option.category === value.category && option.subcategory === value.subcategory
                    }
                    renderInput={(params) => <TextField {...params} label="Category / Subcategory" required={!categoryName} />}
                    fullWidth
                    disableClearable={false}
                />
                <Tooltip title="Manage Categories">
                    <IconButton onClick={() => router.push('/dashboard/categories')}>
                        <SettingsIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <FormControl fullWidth required>
                <InputLabel>Source</InputLabel>
                <Select
                    value={source}
                    label="Source"
                    onChange={(e) => setSource(e.target.value as 'My Money' | 'Wife Money' | 'Mother Money')}
                >
                    <MenuItem value="My Money">My Money</MenuItem>
                    <MenuItem value="Wife Money">Wife Money</MenuItem>
                    <MenuItem value="Mother Money">Mother Money</MenuItem>
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

            {/* UPI Details Section */}
            {paymentMode === 'UPI' && (
                <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                            <Box fontSize="0.9rem" fontWeight="bold">Transaction Details</Box>
                            {/* Visual indicator if valid data present? */}
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Transaction ID (UPI)"
                            size="small"
                            fullWidth
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                        />
                        <TextField
                            label="Google Transaction ID"
                            size="small"
                            fullWidth
                            value={googleTransactionId}
                            onChange={(e) => setGoogleTransactionId(e.target.value)}
                        />
                        <Divider>Participants</Divider>
                        <TextField
                            label="Sender (From)"
                            size="small"
                            fullWidth
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                        />
                        <TextField
                            label="Receiver (To)"
                            size="small"
                            fullWidth
                            value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)}
                        />
                        <TextField
                            label="Bank Name"
                            size="small"
                            fullWidth
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                        />
                    </AccordionDetails>
                </Accordion>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button onClick={onCancel} disabled={loading}>Cancel</Button>
                <Button variant="contained" type="submit" disabled={loading}>
                    {initialData ? 'Update' : 'Save'}
                </Button>
            </Box>
        </Box>
    );
}
