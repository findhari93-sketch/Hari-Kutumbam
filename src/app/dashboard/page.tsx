'use client';
import React from 'react';
import { Typography, Grid, Paper, Box, Button, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const data = [
    { name: 'Jan', Income: 65000, Expense: 42000 },
    { name: 'Feb', Income: 65000, Expense: 38000 },
    { name: 'Mar', Income: 70000, Expense: 45000 },
    { name: 'Apr', Income: 68000, Expense: 39000 },
    { name: 'May', Income: 65000, Expense: 48000 },
    { name: 'Jun', Income: 75000, Expense: 41000 },
];

export default function DashboardPage() {
    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                Financial Overview
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card
                        sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderRadius: 4,
                            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        <CardContent>
                            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Savings (Forecast)</Typography>
                            <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>₹ 1,25,000</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ArrowUpwardIcon fontSize="small" />
                                <Typography variant="caption">+12% from last month</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Monthly Expenses (June)</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ my: 1, color: 'error.main' }}>₹ 41,000</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.light' }}>
                                <ArrowDownwardIcon fontSize="small" />
                                <Typography variant="caption">Within budget</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Net Worth (Gold + Real Estate)</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ my: 1, color: 'success.main' }}>₹ 1.2 Cr</Typography>
                            <Typography variant="caption" color="text.secondary">Updated today</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Analytics Chart */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, height: 400 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Income vs Expense Trend</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
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
                            <Button variant="outlined" startIcon={<ReceiptIcon />} fullWidth size="large">
                                Add Expense
                            </Button>
                            <Button variant="outlined" color="secondary" fullWidth size="large">
                                Log Milk
                            </Button>
                            <Button variant="outlined" color="success" fullWidth size="large">
                                Update Ledger
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
