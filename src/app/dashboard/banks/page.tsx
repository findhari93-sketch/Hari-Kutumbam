'use client';
import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// Mock Data
const MOCK_BANKS = [
    { id: '1', bankName: 'State Bank of India', last4: '4589', balance: 12450.00, type: 'savings', limit: null },
    { id: '2', bankName: 'KVB', last4: '9921', balance: 5600.50, type: 'savings', limit: null },
    { id: '3', bankName: 'HDFC Credit Card', last4: '8812', balance: -15000, type: 'credit', limit: 50000 },
];

export default function BanksPage() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    My Accounts
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />}>Add Account</Button>
            </Box>

            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                Smart Balance (Estimated based on tracked expenses)
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                {MOCK_BANKS.map((bank) => (
                    <Box key={bank.id}>
                        {/* Credit Card Style UI */}
                        <Card
                            sx={{
                                borderRadius: 4,
                                background: bank.type === 'credit'
                                    ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
                                    : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                color: 'white',
                                position: 'relative',
                                overflow: 'hidden',
                                height: 200,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >
                            {/* Abstract Patterns */}
                            <Box sx={{
                                position: 'absolute', top: -50, right: -50, width: 150, height: 150,
                                background: 'rgba(255,255,255,0.1)', borderRadius: '50%'
                            }} />

                            <CardContent sx={{ zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <Typography variant="h6" fontWeight="bold">{bank.bankName}</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase' }}>{bank.type}</Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Available Balance</Typography>
                                    <Typography variant="h4" fontWeight="medium">
                                        ₹ {Math.abs(bank.balance).toLocaleString()}
                                        {bank.type === 'credit' && <Typography component="span" variant="caption" sx={{ ml: 1 }}>Due</Typography>}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ letterSpacing: 2 }}>
                                        •••• •••• •••• {bank.last4}
                                    </Typography>
                                </Box>

                                {bank.type === 'credit' && bank.limit && (
                                    <Box sx={{ mt: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', mb: 0.5 }}>
                                            <span>Used: {Math.round((Math.abs(bank.balance) / bank.limit) * 100)}%</span>
                                            <span>Limit: ₹{bank.limit.toLocaleString()}</span>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(Math.abs(bank.balance) / bank.limit) * 100}
                                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' } }}
                                        />
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
