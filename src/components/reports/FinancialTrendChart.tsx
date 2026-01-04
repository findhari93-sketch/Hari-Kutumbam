import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Paper, Typography } from '@mui/material';

interface TrendData {
    name: string;
    Income: number;
    Expense: number;
    Savings: number;
}

interface FinancialTrendChartProps {
    data: TrendData[];
}

export default function FinancialTrendChart({ data }: FinancialTrendChartProps) {
    return (
        <Paper sx={{ p: 3, borderRadius: 4, height: 400 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Income vs Expense vs Savings</Typography>
            <ResponsiveContainer width="100%" height="90%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="Income" stackId="2" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="Expense" stackId="3" stroke="#F87171" fill="#F87171" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="Savings" stackId="1" stroke="#34D399" fill="#34D399" fillOpacity={0.1} />
                </AreaChart>
            </ResponsiveContainer>
        </Paper>
    );
}
