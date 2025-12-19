'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TrendingDownIcon from '@mui/icons-material/TrendingDown'; // Borrowed
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Lent

export default function LoansPage() {
    const [tabIndex, setTabIndex] = useState(0); // 0: Borrowed (Liabilities), 1: Lent (Assets)
    const [loans, setLoans] = useState([
        { id: 1, person: 'Ramesh (Colleague)', amount: 5000, type: 'borrowed', date: '2023-11-20', status: 'pending' },
        { id: 2, person: 'Suresh (Friend)', amount: 2000, type: 'lent', date: '2023-12-01', status: 'partial' },
    ]);
    const [openAdd, setOpenAdd] = useState(false);

    // Form State
    const [person, setPerson] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('borrowed');

    const handleAddLoan = () => {
        const newLoan = {
            id: Date.now(),
            person,
            amount: Number(amount),
            type,
            date: new Date().toISOString().split('T')[0],
            status: 'pending'
        };
        setLoans([newLoan, ...loans]);
        setOpenAdd(false);
        setPerson('');
        setAmount('');
    };

    const filteredLoans = loans.filter(l => (tabIndex === 0 ? l.type === 'borrowed' : l.type === 'lent'));
    const totalAmount = filteredLoans.reduce((sum, loan) => sum + loan.amount, 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Loan Manager
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
                    Add New Loan
                </Button>
            </Box>

            <Card sx={{ mb: 4, bgcolor: tabIndex === 0 ? 'error.light' : 'success.light', color: 'white' }}>
                <CardContent>
                    <Typography variant="subtitle1">Total {tabIndex === 0 ? 'You Owe' : 'People Owe You'}</Typography>
                    <Typography variant="h3" fontWeight="bold">₹ {totalAmount}</Typography>
                </CardContent>
            </Card>

            <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} centered sx={{ mb: 3 }}>
                <Tab icon={<TrendingDownIcon />} label="Borrowed (My Debts)" />
                <Tab icon={<TrendingUpIcon />} label="Lent (My Assets)" />
            </Tabs>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredLoans.length === 0 && <Typography align="center">No records found.</Typography>}
                {filteredLoans.map((loan) => (
                    <Card key={loan.id} sx={{ borderLeft: 6, borderColor: tabIndex === 0 ? 'error.main' : 'success.main' }}>
                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="h6">{loan.person}</Typography>
                                <Typography variant="body2" color="text.secondary">Taken on: {loan.date}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h6" fontWeight="bold">₹{loan.amount}</Typography>
                                <Chip
                                    label={loan.status}
                                    size="small"
                                    color={loan.status === 'pending' ? 'warning' : 'info'}
                                    variant="outlined"
                                />
                                <Button size="small" sx={{ display: 'block', ml: 'auto' }}>Settle</Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
                <DialogTitle>Add New Loan Record</DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 300 }}>
                    <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={type}
                            label="Type"
                            onChange={(e) => setType(e.target.value)}
                        >
                            <MenuItem value="borrowed">I Borrowed (Liability)</MenuItem>
                            <MenuItem value="lent">I Lent (Asset)</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Person Name"
                        fullWidth
                        value={person}
                        onChange={(e) => setPerson(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Amount"
                        type="number"
                        fullWidth
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
                    <Button onClick={handleAddLoan} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
