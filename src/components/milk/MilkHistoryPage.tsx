'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    Tab,
    Tabs,
    AppBar,
    Toolbar,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button,
    Fab,
    Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import { format } from 'date-fns';
import { MilkLog, MilkPayment } from '@/services/firestore';

interface MilkHistoryPageProps {
    open: boolean;
    onClose: () => void;
    logs: MilkLog[];
    payments: MilkPayment[];
    onUpdateLog: (id: string, date: string, quantity: number, price: number) => Promise<void>;
    onDeleteLog: (id: string) => Promise<void>;
    onAddLog: (date: string, quantity: number, price: number, boiled: boolean) => Promise<void>;
}

export default function MilkHistoryPage({
    open,
    onClose,
    logs,
    payments,
    onUpdateLog,
    onDeleteLog,
    onAddLog
}: MilkHistoryPageProps) {
    const [tab, setTab] = useState(0);

    // Edit State
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<MilkLog | null>(null);
    const [editQty, setEditQty] = useState('');
    const [editDate, setEditDate] = useState('');

    // Add State (Past Entry)
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addDate, setAddDate] = useState('');
    const [addQty, setAddQty] = useState('1');

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const handleEditClick = (log: MilkLog) => {
        setSelectedLog(log);
        setEditQty(log.quantity.toString());
        setEditDate(log.date);
        setEditDialogOpen(true);
    };

    const handleEditSave = async () => {
        if (!selectedLog || !editDate) return;
        const qty = parseFloat(editQty);
        if (isNaN(qty)) return;

        await onUpdateLog(selectedLog.id!, editDate, qty, selectedLog.pricePerLiter);
        setEditDialogOpen(false);
        setSelectedLog(null);
    };

    const handleDeleteClick = async (id: string) => {
        if (confirm("Are you sure you want to delete this record?")) {
            await onDeleteLog(id);
        }
    };

    const handleAddSave = async () => {
        if (!addDate) return;
        const qty = parseFloat(addQty);
        if (isNaN(qty)) return;

        await onAddLog(addDate, qty, 45, true); // Default price/boiled
        setAddDialogOpen(false);
        setAddDate('');
        setAddQty('1');
    };

    return (
        <Dialog fullScreen open={open} onClose={onClose}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                        Milk History
                    </Typography>
                </Toolbar>
                <Tabs value={tab} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
                    <Tab label="Logs" />
                    <Tab label="Settlements" />
                </Tabs>
            </AppBar>

            <Box sx={{ p: 2, pb: 10 }}>
                {tab === 0 && (
                    <>
                        <List>
                            {logs.map((log) => (
                                <React.Fragment key={log.id}>
                                    <ListItem
                                        alignItems="flex-start"
                                        secondaryAction={
                                            <Box>
                                                <IconButton edge="end" aria-label="edit" onClick={() => handleEditClick(log)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(log.id!)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: log.status === 'bought' ? 'primary.light' : 'grey.300' }}>
                                                {log.status === 'bought' ? <LocalDrinkIcon /> : <BlockIcon />}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography fontWeight="500">
                                                    {format(new Date(log.date), 'EEE, d MMM yyyy')}
                                                </Typography>
                                            }
                                            secondary={
                                                <React.Fragment>
                                                    <Typography variant="body2" color="text.primary" component="span">
                                                        {log.status === 'bought' ? `${log.quantity} Liter(s)` : 'Skipped'}
                                                    </Typography>
                                                    <Typography variant="caption" display="block" component="span" sx={{ mt: 0.5 }}>
                                                        ₹{log.cost} • By {log.recordedBy}
                                                    </Typography>
                                                </React.Fragment>
                                            }
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />
                                </React.Fragment>
                            ))}
                        </List>

                        <Fab
                            color="primary"
                            aria-label="add"
                            sx={{ position: 'fixed', bottom: 16, right: 16 }}
                            onClick={() => setAddDialogOpen(true)}
                        >
                            <AddIcon />
                        </Fab>
                    </>
                )}

                {tab === 1 && (
                    <List>
                        {payments.length === 0 ? (
                            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                No settlement history found.
                            </Typography>
                        ) : (
                            payments.map((payment) => (
                                <React.Fragment key={payment.id}>
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'success.light' }}>
                                                <PaymentIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`Paid ₹${payment.amount}`}
                                            secondary={
                                                <React.Fragment>
                                                    <Typography variant="body2" component="span" display="block">
                                                        {format(new Date(payment.date), 'dd MMM yyyy')}
                                                        {payment.note && ` - ${payment.note}`}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" component="span">By {payment.recordedBy}</Typography>
                                                </React.Fragment>
                                            }
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />
                                </React.Fragment>
                            ))
                        )}
                    </List>
                )}
            </Box>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Edit Log Entry</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                        />
                        <TextField
                            label="Quantity (Liters)"
                            type="number"
                            fullWidth
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            helperText="Enter 0 to mark as Skipped"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleEditSave} variant="contained">Save Changes</Button>
                </DialogActions>
            </Dialog>

            {/* Add Past Entry Dialog (Reused logic from Page but inside History context) */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add Past Entry</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Ensure you select a past date. Future dates are not allowed.
                    </Alert>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={addDate}
                            onChange={(e) => setAddDate(e.target.value)}
                        />
                        <TextField
                            label="Quantity (Liters)"
                            type="number"
                            fullWidth
                            value={addQty}
                            onChange={(e) => setAddQty(e.target.value)}
                            helperText="Enter 0 to mark as Skipped"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddSave} variant="contained">Add Entry</Button>
                </DialogActions>
            </Dialog>

        </Dialog>
    );
}
