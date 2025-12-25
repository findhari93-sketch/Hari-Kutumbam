import React, { useState } from 'react';
import {
    Box, Typography, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, List, ListItem, ListItemText,
    ListItemSecondaryAction, IconButton, Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { BankUPI, addBankUPI, deleteBankUPI } from '../../services/bankService';

interface UPIManagerProps {
    accountId: string;
    upis: BankUPI[];
    onRefresh: () => void;
}

export default function UPIManager({ accountId, upis, onRefresh }: UPIManagerProps) {
    const [openAdd, setOpenAdd] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [provider, setProvider] = useState('');

    const handleSave = async () => {
        if (!upiId) return;
        try {
            await addBankUPI({
                accountId,
                upiId,
                provider: provider || 'UPI',
            });
            setOpenAdd(false);
            setUpiId('');
            setProvider('');
            onRefresh();
        } catch (e) { console.error(e); }
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">Linked UPI IDs</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
                    Add UPI
                </Button>
            </Box>

            <List dense sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                {upis.map(u => (
                    <ListItem key={u.id} divider>
                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                            <QrCodeIcon />
                        </Box>
                        <ListItemText
                            primary={u.upiId}
                            secondary={u.provider}
                            primaryTypographyProps={{ fontWeight: 'medium' }}
                        />
                        <ListItemSecondaryAction>
                            <IconButton edge="end" size="small" onClick={() => deleteBankUPI(u.id!).then(onRefresh)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
                {upis.length === 0 && (
                    <Typography variant="caption" sx={{ p: 2, display: 'block', color: 'text.secondary', textAlign: 'center' }}>
                        No UPI IDs added.
                    </Typography>
                )}
            </List>

            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add UPI ID</DialogTitle>
                <DialogContent>
                    <TextField
                        label="UPI ID (e.g. name@okhdfc)"
                        fullWidth
                        margin="dense"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                    />
                    <TextField
                        label="App/Provider (Optional)"
                        fullWidth
                        margin="dense"
                        value={provider}
                        onChange={e => setProvider(e.target.value)}
                        placeholder="GPay, PhonePe..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
