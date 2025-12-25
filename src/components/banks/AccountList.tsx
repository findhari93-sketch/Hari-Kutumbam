import React from 'react';
import { Box, Card, CardContent, Typography, IconButton, Grid, Chip, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { BankAccount } from '../../services/bankService';

interface AccountListProps {
    accounts: BankAccount[];
    onEdit: (account: BankAccount) => void;
    onShare: (account: BankAccount) => void;
}

export default function AccountList({ accounts, onEdit, onShare }: AccountListProps) {
    if (accounts.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <Typography>No bank accounts linked yet.</Typography>
                <Typography variant="caption">Link a savings or current account.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {accounts.map(acc => (
                <Card
                    key={acc.id}
                    sx={{
                        borderRadius: 3,
                        background: acc.type === 'Credit'
                            ? 'linear-gradient(135deg, #37474F 0%, #263238 100%)'
                            : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
                        color: acc.type === 'Credit' ? 'white' : 'text.primary',
                        border: acc.type !== 'Credit' ? '1px solid #eee' : 'none',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Card Brand Header */}
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(128,128,128,0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {acc.type === 'Credit' ? <CreditCardIcon color="inherit" /> : <AccountBalanceIcon color="primary" />}
                            <Typography fontWeight="bold" variant="body1">{acc.bankName}</Typography>
                        </Box>
                        <Chip
                            label={acc.type}
                            size="small"
                            color={acc.type === 'Credit' ? 'secondary' : 'default'}
                            variant={acc.type === 'Credit' ? 'filled' : 'outlined'}
                        />
                    </Box>

                    <CardContent>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Account Number</Typography>
                            <Typography variant="h6" sx={{ letterSpacing: 2 }}>
                                {acc.accountNumber.replace(/.(?=.{4})/g, '•')}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>IFSC: {acc.ifsc}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Box>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>Available Balance</Typography>
                                <Typography variant="h6" fontWeight="bold">₹ {acc.balance.toLocaleString()}</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    size="small"
                                    startIcon={<ShareIcon />}
                                    variant={acc.type === 'Credit' ? "contained" : "outlined"}
                                    color={acc.type === 'Credit' ? "secondary" : "primary"}
                                    onClick={() => onShare(acc)}
                                >
                                    Share
                                </Button>
                                <IconButton
                                    size="small"
                                    onClick={() => onEdit(acc)}
                                    sx={{ border: '1px solid rgba(128,128,128,0.3)' }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
}
