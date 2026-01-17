'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Chip,
    Divider,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Alert
} from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BlockIcon from '@mui/icons-material/Block';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useMilkData } from '@/hooks/useMilkData';
import { format } from 'date-fns';
import MilkNotifications from '@/components/milk/MilkNotifications';
import MilkHistoryPage from '@/components/milk/MilkHistoryPage';

export default function MilkTrackerPage() {
    const {
        logs,
        payments,
        stats,
        addLog,
        addPayment,
        updateLog,
        deleteLog
    } = useMilkData();

    const [settleOpen, setSettleOpen] = useState(false);
    const [settleAmount, setSettleAmount] = useState('');
    const [settleDate, setSettleDate] = useState('');

    // History Modal State
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyDate, setHistoryDate] = useState('');
    const [historyQty, setHistoryQty] = useState('1');

    // View All History (Full Page Mode)
    const [viewAllOpen, setViewAllOpen] = useState(false);

    const pricePerLiter = 45; // Default

    const handleHistorySubmit = async () => {
        if (!historyDate) return;
        const qty = parseFloat(historyQty);
        if (isNaN(qty)) return;

        await addLog(historyDate, qty, pricePerLiter, true);
        setHistoryOpen(false);
        // Reset defaults
        setHistoryDate('');
        setHistoryQty('1');
    };

    const handleSettleSubmit = async () => {
        const amount = parseFloat(settleAmount);
        if (amount > 0) {
            await addPayment(amount, 'Manual Settlement', settleDate); // Pass date
            setSettleOpen(false);
            setSettleAmount('');
            setSettleDate('');
        }
    };

    // Check if today is logged
    const today = new Date().toISOString().split('T')[0];
    const isTodayLogged = logs.some(log => log.date === today);

    const handleQuickAdd = async (qty: number) => {
        // Clear snooze if they log it
        localStorage.removeItem('milk_reminder_snooze');
        await addLog(today, qty, pricePerLiter, true); // Default boiled=true
    };

    const handleSnooze = () => {
        // Snooze for 1 hour
        const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000);
        localStorage.setItem('milk_reminder_snooze', snoozeUntil.toISOString());
        alert("Reminder snoozed for 1 hour.");
    };

    return (
        <Box sx={{ pb: 10 }}>
            <MilkNotifications />

            {/* Full Screen History Component */}
            <MilkHistoryPage
                open={viewAllOpen}
                onClose={() => setViewAllOpen(false)}
                logs={logs}
                payments={payments}
                onUpdateLog={updateLog}
                onDeleteLog={deleteLog}
                onAddLog={addLog}
            />

            {/* Header */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="bold">
                    Milk Tracker
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Month Total / Pending
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                        {stats.litersThisMonth} L <Box component="span" sx={{ color: 'text.secondary', mx: 0.5 }}>|</Box> <Box component="span" color="error.main">₹{stats.pendingAmount}</Box>
                    </Typography>
                </Box>
            </Box>

            <Stack spacing={2}>

                {/* 1. STATUS & ACTION CARD */}
                <Card sx={{
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="primary.main" gutterBottom>
                            {format(new Date(), 'EEEE, d MMMM')}
                        </Typography>

                        {!isTodayLogged ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        color="primary"
                                        startIcon={<WaterDropIcon />}
                                        onClick={() => handleQuickAdd(1)}
                                        sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600 }}
                                    >
                                        Bought 1 L
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<BlockIcon />}
                                        onClick={() => handleQuickAdd(0)}
                                        sx={{ py: 1.5, borderRadius: 2, minWidth: '120px', textTransform: 'none', bgcolor: 'white' }}
                                    >
                                        No Milk
                                    </Button>
                                </Box>

                                <Button
                                    size="small"
                                    startIcon={<NotificationsActiveIcon />}
                                    onClick={handleSnooze}
                                    sx={{ alignSelf: 'center', color: 'text.secondary', textTransform: 'none' }}
                                >
                                    Remind me in 1 hour
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 1 }}>
                                <Typography variant="h6" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <WaterDropIcon /> Recorded
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    You can edit this in History if needed.
                                </Typography>
                            </Box>
                        )}

                        {/* Quick custom add if not logged */}
                        {!isTodayLogged && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <Chip label="+ 0.5 L" onClick={() => handleQuickAdd(0.5)} clickable />
                                <Chip label="+ 1.5 L" onClick={() => handleQuickAdd(1.5)} clickable />
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* 2. SUMMARY */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: '#f8f9fa' }} elevation={0}>
                        <Typography variant="h6" color="primary.main">{stats.litersThisMonth}</Typography>
                        <Typography variant="caption" color="text.secondary">Liters (M)</Typography>
                    </Paper>
                    <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: '#f8f9fa' }} elevation={0}>
                        <Typography variant="h6" color="text.primary">{stats.skippedDays}</Typography>
                        <Typography variant="caption" color="text.secondary">Skipped</Typography>
                    </Paper>
                    <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 3, bgcolor: '#fff3e0' }} elevation={0}>
                        <Typography variant="h6" color="warning.main">₹{stats.totalPaid}</Typography>
                        <Typography variant="caption" color="text.secondary">Paid (All)</Typography>
                    </Paper>
                </Box>

                {/* 3. PENDING */}
                <Card sx={{ borderRadius: 3, border: '1px solid #ffccbc', bgcolor: '#fffbe6' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="subtitle2" color="error.main">Pending Payment</Typography>
                            <Typography variant="h4" fontWeight="bold" color="error.main">
                                ₹{stats.pendingAmount}
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<PaymentIcon />}
                            size="large"
                            onClick={() => setSettleOpen(true)}
                            sx={{ borderRadius: 3, textTransform: 'none' }}
                        >
                            Settle
                        </Button>
                    </CardContent>
                </Card>

                {/* 4. HISTORY */}
                <Box>
                    <Box sx={{ mt: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HistoryIcon fontSize="small" /> Recent Activity
                        </Typography>
                        <Button size="small" onClick={() => setHistoryOpen(true)}>
                            Add Past Entry
                        </Button>
                    </Box>

                    <Card sx={{ borderRadius: 3 }}>
                        <List dense>
                            {logs.slice(0, 5).map((log) => (
                                <React.Fragment key={log.id}>
                                    <ListItem
                                        secondaryAction={
                                            <Typography variant="body2" fontWeight="bold">
                                                ₹{log.cost}
                                            </Typography>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: log.status === 'bought' ? 'primary.light' : 'grey.300' }}>
                                                {log.status === 'bought' ? <LocalDrinkIcon sx={{ fontSize: 16 }} /> : <BlockIcon sx={{ fontSize: 16 }} />}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={log.status === 'bought' ? `${log.quantity} Liter(s)` : 'No Milk'}
                                            secondary={
                                                <span>
                                                    {log.date}
                                                    {log.recordedBy && (
                                                        <Typography component="span" variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                                            By: {log.recordedBy}
                                                        </Typography>
                                                    )}
                                                </span>
                                            }
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))}
                        </List>

                        <Button fullWidth sx={{ p: 1.5, color: 'text.secondary' }} onClick={() => setViewAllOpen(true)}>
                            View All History & Settlements
                        </Button>
                    </Card>
                </Box>

            </Stack>

            {/* Dialogs */}
            <Dialog open={settleOpen} onClose={() => setSettleOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Settle Due Amount</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            Current Due: ₹{stats.pendingAmount}
                        </Typography>
                        <TextField
                            label="Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={settleDate}
                            onChange={(e) => setSettleDate(e.target.value)}
                            helperText="Leave empty for Today"
                        />
                        <TextField
                            autoFocus
                            label="Amount Paying (₹)"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={settleAmount}
                            onChange={(e) => setSettleAmount(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettleOpen(false)}>Cancel</Button>
                    <Button onClick={handleSettleSubmit} variant="contained" color="primary">
                        Record Payment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Past Log Dialog */}
            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add Past Milk Log</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Future dates are not allowed.
                    </Alert>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={historyDate}
                            onChange={(e) => setHistoryDate(e.target.value)}
                        />
                        <TextField
                            label="Quantity (Liters)"
                            type="number"
                            fullWidth
                            value={historyQty}
                            onChange={(e) => setHistoryQty(e.target.value)}
                            helperText="Enter 0 to mark as Skipped"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryOpen(false)}>Cancel</Button>
                    <Button onClick={handleHistorySubmit} variant="contained" color="primary">
                        Add Entry
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
