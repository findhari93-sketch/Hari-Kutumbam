'use client';
import React, { useEffect, useState } from 'react';
import { Typography, Grid, Paper, Box, Button, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningIcon from '@mui/icons-material/Warning';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { expenseService } from '@/services/expenseService';
import { incomeService } from '@/services/incomeService';
import { getGoldItems } from '@/services/goldVault';
import { fetchGoldRate } from '@/services/goldRate';
import { contractService } from '@/services/contractService';
import { getBankAccounts } from '@/services/bankService';
import { format, startOfMonth, subMonths, isSameMonth, differenceInDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Metrics
    const [netWorth, setNetWorth] = useState(0);
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [monthlyExpense, setMonthlyExpense] = useState(0);
    const [savings, setSavings] = useState(0);
    const [chartData, setChartData] = useState<any[]>([]);
    const [expiringContracts, setExpiringContracts] = useState<number>(0);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const now = new Date();
            const currentMonthStart = startOfMonth(now);

            // 1. Fetch All Data in Parallel
            const [expenses, incomes, goldItems, goldRate, accounts, contracts] = await Promise.all([
                expenseService.getAllExpenses(),
                incomeService.getAllIncomes(),
                getGoldItems(user?.uid),
                fetchGoldRate(),
                getBankAccounts(),
                contractService.getAllContracts()
            ]);

            // 2. Calculate Monthly Stats
            const thisMonthExpenses = expenses.filter(e => {
                const d = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
                return !e.isDeleted && isSameMonth(d, now);
            });
            const totalExpense = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

            const thisMonthIncomes = incomes.filter(i => {
                const d = i.date instanceof Timestamp ? i.date.toDate() : new Date(i.date);
                return !i.isDeleted && isSameMonth(d, now);
            });
            const totalIncome = thisMonthIncomes.reduce((sum, i) => sum + i.amount, 0);

            setMonthlyExpense(totalExpense);
            setMonthlyIncome(totalIncome);
            setSavings(totalIncome - totalExpense);

            // 3. Calculate Net Worth
            // Gold Value (Assuming 22k for items)
            const totalGoldWeight = goldItems.reduce((sum, item) => sum + item.weight, 0);
            const goldValue = totalGoldWeight * (goldRate?.price22k || 0);

            // Bank Balance
            const totalBankBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

            setNetWorth(goldValue + totalBankBalance);

            // 4. Prepare Chart Data (Last 6 Months)
            const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
            const chart = last6Months.map(monthDate => {
                const monthName = format(monthDate, 'MMM');

                const monthExp = expenses
                    .filter(e => !e.isDeleted && isSameMonth(e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date), monthDate))
                    .reduce((sum, e) => sum + e.amount, 0);

                const monthInc = incomes
                    .filter(i => !i.isDeleted && isSameMonth(i.date instanceof Timestamp ? i.date.toDate() : new Date(i.date), monthDate))
                    .reduce((sum, i) => sum + i.amount, 0);

                return { name: monthName, Income: monthInc, Expense: monthExp };
            });
            setChartData(chart);

            // 5. Expiring Contracts
            const expiring = contracts.filter(c => {
                if (c.isDeleted) return false;
                const date = c.expiryDate instanceof Timestamp ? c.expiryDate.toDate() : new Date(c.expiryDate);
                const days = differenceInDays(date, now);
                return days >= 0 && days <= 30;
            });
            setExpiringContracts(expiring.length);

        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSkeleton type="dashboard" />;
    }

    return (
        <Box sx={{ pb: 8 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                Financial Overview
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 4, boxShadow: '0 8px 32px rgba(37, 99, 235, 0.2)' }}>
                        <CardContent>
                            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Net Worth (Gold + Bank)</Typography>
                            <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>₹ {netWorth.toLocaleString()}</Typography>
                            <Typography variant="caption">Live Estimate</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Monthly Savings (Net)</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ my: 1, color: savings >= 0 ? 'success.main' : 'error.main' }}>
                                ₹ {Math.abs(savings).toLocaleString()}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {savings >= 0 ? <ArrowUpwardIcon fontSize="small" color="success" /> : <ArrowDownwardIcon fontSize="small" color="error" />}
                                <Typography variant="caption" color={savings >= 0 ? 'success.main' : 'error.main'}>
                                    {savings >= 0 ? 'Positive Cashflow' : 'Deficit'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Expenses (This Month)</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ my: 1, color: 'error.main' }}>
                                ₹ {monthlyExpense.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Income: ₹ {monthlyIncome.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Alerts */}
            {expiringContracts > 0 && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }} onClick={() => router.push('/dashboard/contracts')} style={{ cursor: 'pointer' }}>
                    Warning: You have {expiringContracts} contract(s) expiring within 30 days. Click to view.
                </Alert>
            )}

            {/* Analytics Chart */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, height: 400 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Income vs Expense Trend</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Bar dataKey="Income" fill="#60A5FA" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="Expense" fill="#F87171" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Quick Actions</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<ReceiptIcon />}
                                fullWidth
                                size="large"
                                onClick={() => router.push('/dashboard/expenses')}
                            >
                                Add Expense
                            </Button>
                            <Button variant="outlined" color="primary" fullWidth size="large" onClick={() => router.push('/dashboard/income')}>
                                Add Income
                            </Button>
                            <Button variant="outlined" color="secondary" fullWidth size="large" onClick={() => router.push('/dashboard/milk')}>
                                Log Milk
                            </Button>
                            <Button variant="outlined" color="warning" fullWidth size="large" onClick={() => router.push('/dashboard/gold')}>
                                Add Gold
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
