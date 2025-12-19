'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tab,
    Tabs,
    Paper,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/context/AuthContext';
// In a real app, we would fetch/save this to Firestore

interface IncomeSource {
    id: string;
    name: string;
    expectedAmount: string;
}

interface BankAccountSetup {
    id: string;
    bankName: string;
    last4: string;
    initialBalance: string;
}

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function SettingsPage() {
    const { user } = useAuth();
    const [value, setValue] = useState(0);

    // --- Local State for UI Demo ---
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([
        { id: '1', name: 'Salary (Job)', expectedAmount: '50000' },
        { id: '2', name: 'Rental Income', expectedAmount: '15000' },
    ]);
    const [banks, setBanks] = useState<BankAccountSetup[]>([
        { id: '1', bankName: 'SBI', last4: '1234', initialBalance: '25000' }
    ]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleAddIncome = () => {
        setIncomeSources([...incomeSources, { id: Date.now().toString(), name: '', expectedAmount: '' }]);
    };

    const handleUpdateIncome = (id: string, field: keyof IncomeSource, val: string) => {
        setIncomeSources(incomeSources.map(i => i.id === id ? { ...i, [field]: val } : i));
    };

    const handleDeleteIncome = (id: string) => {
        setIncomeSources(incomeSources.filter(i => i.id !== id));
    };

    const handleAddBank = () => {
        setBanks([...banks, { id: Date.now().toString(), bankName: '', last4: '', initialBalance: '' }]);
    };

    const handleUpdateBank = (id: string, field: keyof BankAccountSetup, val: string) => {
        setBanks(banks.map(b => b.id === id ? { ...b, [field]: val } : b));
    };


    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Settings & Configuration
            </Typography>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs value={value} onChange={handleChange} indicatorColor="primary" textColor="primary">
                    <Tab label="Profile" />
                    <Tab label="Income Sources" />
                    <Tab label="Bank Accounts" />
                </Tabs>
            </Paper>

            <TabPanel value={value} index={0}>
                <Card>
                    <CardContent>
                        <Typography variant="h6">User Profile</Typography>
                        <Typography>Email: {user?.email}</Typography>
                        <Typography>Role: Admin (Default)</Typography>
                    </CardContent>
                </Card>
            </TabPanel>

            <TabPanel value={value} index={1}>
                <Typography variant="h6" gutterBottom>Manage Income Sources</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Define your regular income streams here for better forecasting.
                </Typography>

                {incomeSources.map((source) => (
                    <Box key={source.id} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                        <TextField
                            label="Source Name"
                            size="small"
                            value={source.name}
                            onChange={(e) => handleUpdateIncome(source.id, 'name', e.target.value)}
                        />
                        <TextField
                            label="Expected Amount"
                            size="small"
                            type="number"
                            value={source.expectedAmount}
                            onChange={(e) => handleUpdateIncome(source.id, 'expectedAmount', e.target.value)}
                        />
                        <IconButton color="error" onClick={() => handleDeleteIncome(source.id)}>
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                ))}
                <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAddIncome}>
                    Add Income Source
                </Button>
                <Box sx={{ mt: 4 }}>
                    <Button variant="contained">Save Changes</Button>
                </Box>
            </TabPanel>

            <TabPanel value={value} index={2}>
                <Typography variant="h6" gutterBottom>Bank Accounts</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Setup your accounts for "Smart Balance" tracking.
                </Typography>
                {banks.map((bank) => (
                    <Box key={bank.id} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                        <TextField
                            label="Bank Name"
                            size="small"
                            value={bank.bankName}
                            onChange={(e) => handleUpdateBank(bank.id, 'bankName', e.target.value)}
                        />
                        <TextField
                            label="Last 4 Digits"
                            size="small"
                            value={bank.last4}
                            onChange={(e) => handleUpdateBank(bank.id, 'last4', e.target.value)}
                        />
                        <TextField
                            label="Initial Balance"
                            size="small"
                            type="number"
                            value={bank.initialBalance}
                            onChange={(e) => handleUpdateBank(bank.id, 'initialBalance', e.target.value)}
                        />
                        <IconButton color="error" onClick={() => {
                            // setBanks(...)
                        }}>
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                ))}
                <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAddBank}>
                    Add Bank Account
                </Button>
                <Box sx={{ mt: 4 }}>
                    <Button variant="contained">Save Changes</Button>
                </Box>
            </TabPanel>
        </Box>
    );
}
