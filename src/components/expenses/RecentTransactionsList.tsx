'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import {
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Typography,
    Chip,
    Skeleton
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { pink, green } from '@mui/material/colors';
import { expenseService } from '@/services/expenseService';
import { Expense } from '@/types';
import { Timestamp } from 'firebase/firestore';

import { useAuth } from '@/context/AuthContext';

export default function RecentTransactionsList() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            if (!user) return;
            try {
                const all = await expenseService.getAllExpenses(user.uid);
                // Get top 5 recent
                setTransactions(all.slice(0, 5));
            } catch (err) {
                console.error("Failed to fetch recent transactions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();
    }, [user]);

    if (loading) {
        return (
            <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 3 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} height={60} />)}
            </List>
        );
    }

    if (transactions.length === 0) {
        return <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>No recent activity</Typography>;
    }

    return (
        <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 3 }}>
            {transactions.map((transaction) => {
                // For now assuming all in 'expenses' collection are expenses. 
                const isExpense = true;
                const isMothersMoney = transaction.source === 'Mother Money';

                const dateStr = transaction.date instanceof Timestamp
                    ? transaction.date.toDate().toLocaleDateString()
                    : new Date(transaction.date).toLocaleDateString();

                return (
                    <ListItem key={transaction.id} alignItems="flex-start">
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: pink[100], color: pink[700] }}>
                                <ReceiptIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <React.Fragment>
                                    <Typography component="span" variant="subtitle1" fontWeight="medium">
                                        {transaction.category}
                                    </Typography>
                                    {isMothersMoney && (
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
                                        {dateStr}
                                    </Typography>
                                    {" — " + (transaction.description || 'No description')}
                                </React.Fragment>
                            }
                        />
                        <Typography
                            variant="body1"
                            fontWeight="bold"
                            color={'error.main'}
                            sx={{ alignSelf: 'center' }}
                        >
                            -₹{transaction.amount}
                        </Typography>
                    </ListItem>
                );
            })}
        </List>
    );
}
