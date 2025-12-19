'use client';
import React from 'react';
import {
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Typography,
    Chip
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { pink, green } from '@mui/material/colors';

// Mock data until we connect to Firestore
const MOCK_TRANSACTIONS = [
    { id: '1', type: 'expense', category: 'Groceries', amount: 1200, date: '2023-12-19', description: 'Weekly veggies' },
    { id: '2', type: 'income', category: 'Salary', amount: 50000, date: '2023-12-01', description: 'Dec Salary', isMothersMoney: false },
    { id: '3', type: 'expense', category: 'Milk', amount: 45, date: '2023-12-18', description: 'Vendor A' },
    { id: '4', type: 'income', category: 'Rental', amount: 15000, date: '2023-12-05', isMothersMoney: true },
];

export default function RecentTransactionsList() {
    return (
        <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 3 }}>
            {MOCK_TRANSACTIONS.map((transaction) => {
                const isExpense = transaction.type === 'expense';
                return (
                    <React.Fragment key={transaction.id}>
                        <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: isExpense ? pink[100] : green[100], color: isExpense ? pink[700] : green[700] }}>
                                    {isExpense ? <ReceiptIcon /> : <AttachMoneyIcon />}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <React.Fragment>
                                        <Typography component="span" variant="subtitle1" fontWeight="medium">
                                            {transaction.category}
                                        </Typography>
                                        {transaction.isMothersMoney && (
                                            <Chip label="Mom's" size="small" color="secondary" sx={{ ml: 1, height: 20 }} />
                                        )}
                                    </React.Fragment>

                                }
                                secondary={
                                    <React.Fragment>
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            color="text.primary"
                                        >
                                            {transaction.date}
                                        </Typography>
                                        {" — " + (transaction.description || 'No description')}
                                    </React.Fragment>
                                }
                            />
                            <Typography
                                variant="body1"
                                fontWeight="bold"
                                color={isExpense ? 'error.main' : 'success.main'}
                                sx={{ alignSelf: 'center' }}
                            >
                                {isExpense ? '-' : '+'}₹{transaction.amount}
                            </Typography>
                        </ListItem>
                    </React.Fragment>
                );
            })}
        </List>
    );
}
