'use client';
import React, { useEffect, useState } from 'react';
import { Box, Grid, CircularProgress, Card, CardContent, Typography } from '@mui/material';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, isWithinInterval, format, parseISO } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

import { expenseService } from '@/services/expenseService';
import { incomeService } from '@/services/incomeService';
import { Category } from '@/types';

import ReportFilters, { DateRange } from '@/components/reports/ReportFilters';
import CategoryPieChart from '@/components/reports/CategoryPieChart';
import FinancialTrendChart from '@/components/reports/FinancialTrendChart';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

// Color palette for categories
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B', '#4CC9F0', '#F72585'];

import { useAuth } from '@/context/AuthContext';

export default function ReportsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>('this-month');

    // Raw Data
    const [expenses, setExpenses] = useState<any[]>([]);
    const [incomes, setIncomes] = useState<any[]>([]);

    // Processed Data
    const [pieData, setPieData] = useState<any[]>([]);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, savings: 0, rate: 0 });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    useEffect(() => {
        processData();
    }, [dateRange, expenses, incomes]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [fetchedExpenses, fetchedIncomes] = await Promise.all([
                expenseService.getAllExpenses(user?.uid),
                incomeService.getAllIncomes(user?.uid)
            ]);
            setExpenses(fetchedExpenses);
            setIncomes(fetchedIncomes);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    const processData = () => {
        if (loading) return;

        const now = new Date();
        let start: Date;
        let end: Date = now;

        // 1. Determine Date Range
        switch (dateRange) {
            case 'this-month':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'last-month':
                start = startOfMonth(subMonths(now, 1));
                end = endOfMonth(subMonths(now, 1));
                break;
            case 'last-3-months':
                start = subMonths(now, 3);
                break;
            case 'this-year':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
            case 'all-time':
                start = new Date(0); // Epoch
                break;
            default:
                start = startOfMonth(now);
        }

        // 2. Filter Data
        const filteredExpenses = expenses.filter(e => {
            if (e.isDeleted) return false;
            const d = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
            return isWithinInterval(d, { start, end });
        });

        const filteredIncomes = incomes.filter(i => {
            if (i.isDeleted) return false;
            const d = i.date instanceof Timestamp ? i.date.toDate() : new Date(i.date);
            return isWithinInterval(d, { start, end });
        });

        // 3. Calculate Summary
        const totalExp = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalInc = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
        const netSavings = totalInc - totalExp;
        const savingsRate = totalInc > 0 ? (netSavings / totalInc) * 100 : 0;

        setSummary({
            income: totalInc,
            expense: totalExp,
            savings: netSavings,
            rate: savingsRate
        });

        // 4. Prepare Pie Chart Data (Category-wise)
        const categoryMap: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            const cat = e.category || 'Uncategorized';
            categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
        });

        const pie = Object.keys(categoryMap).map((cat, index) => ({
            name: cat,
            value: categoryMap[cat],
            color: COLORS[index % COLORS.length]
        })).sort((a, b) => b.value - a.value);

        setPieData(pie);

        // 5. Prepare Trend Data (Depends on range)
        // For simple buckets, we'll do Monthly grouping if range > 1 month, else Daily/Weekly?
        // Let's stick to Monthly for Everything > 1 month. Daily for 'this-month'? 
        // For simplicity/robustness, let's just show Monthly Trend for all ranges (except 'this-month' maybe daily?)

        // Let's do a uniform map: group by Month (MMM)
        const trendMap: Record<string, { income: number; expense: number }> = {};

        // Helper to get key
        const getKey = (d: Date) => format(d, 'MMM yyyy');

        [...filteredExpenses].forEach(e => {
            const d = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
            const k = getKey(d);
            if (!trendMap[k]) trendMap[k] = { income: 0, expense: 0 };
            trendMap[k].expense += e.amount;
        });

        [...filteredIncomes].forEach(i => {
            const d = i.date instanceof Timestamp ? i.date.toDate() : new Date(i.date);
            const k = getKey(d);
            if (!trendMap[k]) trendMap[k] = { income: 0, expense: 0 };
            trendMap[k].income += i.amount;
        });

        // Convert to array and sort chronologically
        // To sort correctly, we need the original date or standard format.
        // Let's rely on the fact we can parse MMM yyyy or just use a helper
        const trendArray = Object.keys(trendMap).map(key => ({
            name: key,
            Income: trendMap[key].income,
            Expense: trendMap[key].expense,
            Savings: trendMap[key].income - trendMap[key].expense
        }));

        // Quick sort by date
        trendArray.sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

        setTrendData(trendArray);
    };

    const handleExport = () => {
        // Flatten data for CSV
        const rows = [
            ['Date', 'Type', 'Category', 'Amount', 'Description', 'Source/Mode'],
            ...expenses.map(e => [
                format(e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date), 'yyyy-MM-dd'),
                'Expense',
                e.category,
                e.amount,
                e.description,
                e.paymentMode
            ]),
            ...incomes.map(i => [
                format(i.date instanceof Timestamp ? i.date.toDate() : new Date(i.date), 'yyyy-MM-dd'),
                'Income',
                i.source,
                i.amount,
                i.description,
                'Income'
            ])
        ];

        const csvContent = "data:text/csv;charset=utf-8,"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `financial_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link); // Required for FF
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return <LoadingSkeleton type="dashboard" />; // Dashboard type fits well here nicely
    }

    return (
        <Box sx={{ pb: 8 }}>

            <ReportFilters currentRange={dateRange} onRangeChange={setDateRange} onExport={handleExport} />

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ borderRadius: 4, height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Total Income</Typography>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: 'primary.main', my: 1 }}>
                                ₹ {summary.income.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ borderRadius: 4, height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Total Expenses</Typography>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: 'error.main', my: 1 }}>
                                ₹ {summary.expense.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ borderRadius: 4, height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Net Savings</Typography>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: summary.savings >= 0 ? 'success.main' : 'error.main', my: 1 }}>
                                ₹ {summary.savings.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ borderRadius: 4, height: '100%' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Savings Rate</Typography>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: summary.rate >= 20 ? 'success.main' : 'warning.main', my: 1 }}>
                                {summary.rate.toFixed(1)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <FinancialTrendChart data={trendData} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <CategoryPieChart data={pieData} />
                </Grid>
            </Grid>
        </Box>
    );
}
