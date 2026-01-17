'use client';
import React, { useEffect, useState } from 'react';
import { Typography, Grid, Paper, Box, Button, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningIcon from '@mui/icons-material/Warning';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import DiamondIcon from '@mui/icons-material/Diamond';
import { alpha } from '@mui/material/styles';
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
                expenseService.getAllExpenses(user?.uid),
                incomeService.getAllIncomes(user?.uid),
                getGoldItems(user?.uid),
                fetchGoldRate(),
                getBankAccounts(),
                contractService.getAllContracts(user?.uid)
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
                    <Card sx={{
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: 'white',
                        boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.3), 0 10px 10px -5px rgba(37, 99, 235, 0.2)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                            <DiamondIcon sx={{ fontSize: 180 }} />
                        </Box>
                        <CardContent sx={{ position: 'relative', p: 3 }}>
                            <Typography variant="subtitle2" sx={{ opacity: 0.9, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Net Worth</Typography>
                            <Typography variant="h3" fontWeight="800" sx={{ my: 1 }}>₹ {netWorth.toLocaleString()}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.9 }}>
                                <Typography variant="caption" sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.5, borderRadius: 1, fontWeight: 500 }}>
                                    Gold + Bank
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="600" sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>Monthly Savings</Typography>
                                    <Typography variant="h4" fontWeight="800" sx={{ my: 0.5, color: savings >= 0 ? 'success.main' : 'error.main' }}>
                                        ₹ {Math.abs(savings).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    p: 1,
                                    borderRadius: '50%',
                                    bgcolor: savings >= 0 ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
                                    color: savings >= 0 ? 'success.main' : 'error.main',
                                    display: 'flex'
                                }}>
                                    {savings >= 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                </Box>
                            </Box>
                            <Typography variant="body2" color={savings >= 0 ? 'success.main' : 'error.main'} sx={{ mt: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {savings >= 0 ? '+ Positive Cashflow' : '- Deficit Alert'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="600" sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>Expenses (This Month)</Typography>
                                    <Typography variant="h4" fontWeight="800" sx={{ my: 0.5, color: 'error.main' }}>
                                        ₹ {monthlyExpense.toLocaleString()}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    p: 1,
                                    borderRadius: '50%',
                                    bgcolor: alpha('#EF4444', 0.1),
                                    color: 'error.main',
                                    display: 'flex'
                                }}>
                                    <ArrowDownwardIcon fontSize="small" />
                                </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Income: <span style={{ fontWeight: 600, color: '#10B981' }}>₹ {monthlyIncome.toLocaleString()}</span>
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

            {/* Analytics & Actions Grid */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, height: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight="700">Financial Trends</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#60A5FA' }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight="500">Income</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#F87171' }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight="500">Expense</Typography>
                                </Box>
                            </Box>
                        </Box>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={16}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748B', fontSize: 11 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{
                                        borderRadius: 8,
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }}
                                />
                                <Bar dataKey="Income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 0, height: '100%', bgcolor: 'transparent', boxShadow: 'none' }}>
                        <Typography variant="h6" gutterBottom fontWeight="700" sx={{ mb: 2, px: 1 }}>Quick Actions</Typography>
                        <Grid container spacing={2}>
                            {[
                                { label: 'Expense', icon: <ReceiptIcon sx={{ fontSize: 24 }} />, color: '#EF4444', onClick: () => router.push('/dashboard/expenses') },
                                { label: 'Income', icon: <ArrowUpwardIcon sx={{ fontSize: 24 }} />, color: '#10B981', onClick: () => router.push('/dashboard/income') },
                                { label: 'Milk Log', icon: <LocalDrinkIcon sx={{ fontSize: 24 }} />, color: '#3B82F6', onClick: () => router.push('/dashboard/milk') },
                                { label: 'Gold', icon: <DiamondIcon sx={{ fontSize: 24 }} />, color: '#F59E0B', onClick: () => router.push('/dashboard/gold') }
                            ].map((action, index) => (
                                <Grid size={{ xs: 6 }} key={index}>
                                    <Card
                                        onClick={action.onClick}
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 1.5,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            height: '100%'
                                            // borderRadius inherited from theme (16)
                                        }}
                                    >
                                        <Box sx={{
                                            p: 1.5,
                                            borderRadius: '50%',
                                            bgcolor: alpha(action.color, 0.1),
                                            color: action.color
                                        }}>
                                            {action.icon}
                                        </Box>
                                        <Typography variant="body2" fontWeight="600" align="center">{action.label}</Typography>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
