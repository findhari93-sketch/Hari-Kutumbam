import React from 'react';
import {
    Drawer, Box, Typography, List, ListItem, ListItemIcon, ListItemText,
    Button, Divider, Snackbar, ListItemButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { BankAccount, BankCard, BankEntity, BankUPI } from '../../services/bankService';

interface ShareMenuProps {
    open: boolean;
    onClose: () => void;
    account: BankAccount | null;
    entity: BankEntity | null;
    cards?: BankCard[];
    upis?: BankUPI[];
}

export default function ShareMenu({ open, onClose, account, entity, cards = [], upis = [] }: ShareMenuProps) {
    const [snackOpen, setSnackOpen] = React.useState(false);

    if (!account || !entity) return null;

    const copyToClipboard = async (text: string) => {
        try {
            if (navigator.share) {
                await navigator.share({
                    text: text
                });
            } else {
                await navigator.clipboard.writeText(text);
                setSnackOpen(true);
            }
            onClose();
        } catch (e) { console.error(e); }
    };

    // --- TEMPLATES ---

    const getBankTransferText = () => {
        return `🏦 *Bank Transfer Details*
━━━━━━━━━━━━━━━━━━━━━
Name: *${entity.name}*
${entity.pan ? `PAN: ${entity.pan}` : ''}
━━━━━━━━━━━━━━━━━━━━━
Bank: ${account.bankName}
Num: *${account.accountNumber}*
IFSC: *${account.ifsc}*
Type: ${account.type}
━━━━━━━━━━━━━━━━━━━━━`;
    };

    const getUPIText = () => {
        if (upis.length === 0) return null;
        const main = upis[0];
        return `📱 *UPI Payment Details*
━━━━━━━━━━━━━━━━━━━━━
UPI ID: *${main.upiId}*
Name: ${entity.name}
Bank: ${account.bankName}
━━━━━━━━━━━━━━━━━━━━━`;
    };

    const getCardText = (card: BankCard) => {
        return `💳 *Card Details*
━━━━━━━━━━━━━━━━━━━━━
Card: **** **** **** ${card.cardNumberLast4}
Expiry: ${card.expiryDate}
Name: ${card.nameOnCard}
Bank: ${account.bankName}
━━━━━━━━━━━━━━━━━━━━━`;
    };

    return (
        <>
            <Drawer
                anchor="bottom"
                open={open}
                onClose={onClose}
                PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16 } }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" align="center" gutterBottom>Share Details</Typography>
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => copyToClipboard(getBankTransferText())}>
                                <ListItemIcon><AccountBalanceIcon color="primary" /></ListItemIcon>
                                <ListItemText
                                    primary="Bank Transfer (NEFT/IMPS)"
                                    secondary="Includes Account No, IFSC, PAN"
                                />
                            </ListItemButton>
                        </ListItem>

                        {upis.length > 0 && (
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => copyToClipboard(getUPIText()!)}>
                                    <ListItemIcon><QrCodeIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Share UPI ID" secondary={upis[0].upiId} />
                                </ListItemButton>
                            </ListItem>
                        )}

                        {cards.map(card => (
                            <ListItem disablePadding key={card.id}>
                                <ListItemButton onClick={() => copyToClipboard(getCardText(card))}>
                                    <ListItemIcon><CreditCardIcon color="secondary" /></ListItemIcon>
                                    <ListItemText primary={`Share Card: ${card.cardNumberLast4}`} secondary="Expiry & Name (No CVV)" />
                                </ListItemButton>
                            </ListItem>
                        ))}

                    </List>
                </Box>
            </Drawer>
            <Snackbar
                open={snackOpen}
                autoHideDuration={2000}
                onClose={() => setSnackOpen(false)}
                message="Copied to clipboard!"
            />
        </>
    );
}
