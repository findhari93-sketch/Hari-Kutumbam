import React, { useState } from 'react';
import {
    Box, Typography, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, Card, CardContent,
    useTheme, Chip, Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { BankCard, addBankCard, deleteBankCard } from '../../services/bankService';
import { decryptSensitive, encryptSensitive } from '../../utils/encryptionUtils';

interface CardManagerProps {
    accountId: string;
    cards: BankCard[];
    onRefresh: () => void;
}

export default function CardManager({ accountId, cards, onRefresh }: CardManagerProps) {
    const [openAdd, setOpenAdd] = useState(false);
    const [revealedCardId, setRevealedCardId] = useState<string | null>(null);

    // Form State
    const [cardNumber, setCardNumber] = useState('');
    const [nameOnCard, setNameOnCard] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [pin, setPin] = useState('');
    const [type, setType] = useState<any>('Visa');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!cardNumber || !expiry) return;
        setSaving(true);
        try {
            await addBankCard({
                accountId,
                cardNumber,
                nameOnCard,
                expiryDate: expiry,
                cvvEncrypted: encryptSensitive(cvv), // Service encrypts this? No, service expects encrypted? Wait, service encrypts number. Service interface expects plain for addBankCard?
                // Correction: My service 'addBankCard' takes 'cardNumber', but expecting 'cvvEncrypted' in the interface.
                // I need to encrypt CVV/PIN here or update service to encrypt them.
                // Let's encrypt here for generic fields, but service handles CardNumber specially.
                // Actually my service 'addBankCard' signature was:
                // addBankCard(card: Omit<BankCard, 'id' | 'cardNumberLast4'> & { cardNumber: string })
                // So it expects 'cvvEncrypted' string. I should encrypt it here using util.

                // Oops, I should import encryptSensitive here.
                pinEncrypted: encryptSensitive(pin),
                type: type,
                variant: 'Standard'
            } as any);
            // NOTE: I need to encrypt CVV/PIN before sending to addBankCard based on my interface design
            // Let's fix the imports and logic below.
            setOpenAdd(false);
            onRefresh();
            resetForm();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setCardNumber('');
        setNameOnCard('');
        setExpiry('');
        setCvv('');
        setPin('');
    };

    const toggleReveal = (id: string) => {
        if (revealedCardId === id) setRevealedCardId(null);
        else {
            setRevealedCardId(id);
            // Auto-hide after 30s
            setTimeout(() => setRevealedCardId(null), 30000);
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">Linked Cards</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
                    Add Card
                </Button>
            </Box>

            {cards.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No cards linked to this account.
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                    {cards.map(card => {
                        const isRevealed = revealedCardId === card.id;
                        return (
                            <Box
                                key={card.id}
                                sx={{
                                    minWidth: 280,
                                    maxWidth: 320,
                                    height: 180,
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg, #1A237E 0%, #0D47A1 100%)',
                                    color: 'white',
                                    p: 2,
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: 3
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ letterSpacing: 2 }}>{card.type.toUpperCase()}</Typography>
                                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)' }} onClick={() => toggleReveal(card.id!)}>
                                        {isRevealed ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                    </IconButton>
                                </Box>

                                <Typography variant="h6" sx={{ letterSpacing: 3, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                    {isRevealed
                                        ? decryptSensitive(card.cardNumberEncrypted)
                                        : `•••• •••• •••• ${card.cardNumberLast4}`}
                                </Typography>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <Box>
                                        <Typography variant="caption" display="block" sx={{ opacity: 0.7, fontSize: 10 }}>VALID THRU</Typography>
                                        <Typography variant="body2">{card.expiryDate}</Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>{card.nameOnCard}</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        {isRevealed && (
                                            <>
                                                <Typography variant="caption" display="block" sx={{ opacity: 0.7, fontSize: 10 }}>CVV / PIN</Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {decryptSensitive(card.cvvEncrypted)} / {decryptSensitive(card.pinEncrypted)}
                                                </Typography>
                                            </>
                                        )}
                                        <IconButton
                                            size="small"
                                            sx={{ color: 'rgba(255,100,100,0.8)', mt: 1 }}
                                            onClick={() => { if (confirm('Delete card?')) { deleteBankCard(card.id!).then(onRefresh); } }}
                                        >
                                            <DeleteIcon fontSize="inherit" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            )}

            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add Card</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Card Number"
                            fullWidth
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            inputProps={{ maxLength: 19 }}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Expiry (MM/YY)"
                                value={expiry}
                                onChange={e => setExpiry(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="CVV"
                                value={cvv}
                                onChange={e => setCvv(e.target.value)}
                                fullWidth
                                type="password"
                            />
                        </Box>
                        <TextField
                            label="ATM PIN (Optional)"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            fullWidth
                            type="password"
                        />
                        <TextField
                            label="Name on Card"
                            value={nameOnCard}
                            onChange={e => setNameOnCard(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Type (Visa/Mastercard...)"
                            value={type}
                            onChange={e => setType(e.target.value)}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        // Import encryption here to avoid top-level cyclic dependency issues or just duplicate small logic
                        // Need to actually import 'encryptSensitive' in the file header.
                        // For now, I'll update the component to invoke a passed prop or dynamic import, 
                        // BUT better to just fix the logic in the 'handleSave' above.
                        // I will assume I can update the file content to import it.
                        handleSave();
                    }}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
// Note: I will need to ensure `encryptSensitive` is imported and used in handleSave.
// See next tool call update.
