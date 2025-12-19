'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    Switch,
    FormControlLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions
} from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';

export default function MilkTrackerPage() {
    // State
    const [logs, setLogs] = useState([
        { date: '2023-12-19', quantity: 1, boiled: true, cost: 45 },
        { date: '2023-12-18', quantity: 1.5, boiled: false, cost: 67.5 },
        { date: '2023-12-17', quantity: 1, boiled: true, cost: 45 },
    ]);
    const [balance, setBalance] = useState(550.0); // Example > 500
    const [isBoiled, setIsBoiled] = useState(true);

    // Vendor Settings
    const [vendorName, setVendorName] = useState('Raju Milk');
    const [pricePerLiter, setPricePerLiter] = useState(45);
    const [openSettings, setOpenSettings] = useState(false);

    const handleQuickAdd = (qty: number) => {
        const cost = qty * pricePerLiter;
        const newLog = {
            date: new Date().toISOString().split('T')[0],
            quantity: qty,
            boiled: isBoiled,
            cost
        };
        setLogs([newLog, ...logs]);
        setBalance(balance + cost);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Milk Tracker
                </Typography>
                <Button startIcon={<SettingsIcon />} onClick={() => setOpenSettings(true)}>
                    Vendor Settings
                </Button>
            </Box>

            {/* Balance Alert (User rule: > 500 notification) */}
            {balance > 500 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Balance Alert: You owe ₹{balance} to {vendorName}. Please clear the dues.
                </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                    <Card sx={{ borderRadius: 4, height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Log Today's Milk</Typography>

                            <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    onClick={() => handleQuickAdd(1)}
                                    sx={{ py: 2, fontSize: '1.2rem' }}
                                >
                                    1 Liter
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    onClick={() => handleQuickAdd(0.5)}
                                    sx={{ py: 2, fontSize: '1.2rem' }}
                                >
                                    0.5 L
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    onClick={() => handleQuickAdd(1.5)}
                                    sx={{ py: 2, fontSize: '1.2rem' }}
                                >
                                    1.5 L
                                </Button>
                            </Box>

                            <FormControlLabel
                                control={<Switch checked={isBoiled} onChange={(e) => setIsBoiled(e.target.checked)} />}
                                label="Milk was Boiled?"
                                sx={{ mb: 2 }}
                            />

                            <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Current Vendor</Typography>
                                <Typography variant="h6">{vendorName} (@ ₹{pricePerLiter}/L)</Typography>
                                <Typography variant="h5" color="error.main" fontWeight="bold" sx={{ mt: 1 }}>
                                    Due: ₹{balance}
                                </Typography>
                                <Button size="small" variant="text" color="error">Record Payment</Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ flex: 1.5 }}>
                    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 4 }}>
                        <TableContainer sx={{ maxHeight: 440 }}>
                            <Table stickyHeader aria-label="sticky table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="right">Qty (L)</TableCell>
                                        <TableCell align="center">Boiled</TableCell>
                                        <TableCell align="right">Cost</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.map((log, idx) => (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={idx}>
                                            <TableCell>{log.date}</TableCell>
                                            <TableCell align="right">{log.quantity}</TableCell>
                                            <TableCell align="center">
                                                {log.boiled ? <WaterDropIcon fontSize="small" color="primary" /> : '-'}
                                            </TableCell>
                                            <TableCell align="right">₹{log.cost}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
            </Box>

            {/* Settings Dialog */}
            <Dialog open={openSettings} onClose={() => setOpenSettings(false)}>
                <DialogTitle>Vendor Settings</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Vendor Name"
                        fullWidth
                        variant="outlined"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        margin="dense"
                        label="Price per Liter (₹)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={pricePerLiter}
                        onChange={(e) => setPricePerLiter(Number(e.target.value))}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSettings(false)}>Cancel</Button>
                    <Button onClick={() => setOpenSettings(false)} variant="contained" color="primary">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}


