import React, { useMemo, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Skeleton,
    ToggleButton,
    ToggleButtonGroup,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    Paper
} from '@mui/material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { HistoricalRate } from '@/services/goldRate';
import { format, parseISO, subDays } from 'date-fns';

interface GoldAnalyticsProps {
    history: HistoricalRate[];
    loading: boolean;
    currentPrice: number;
    city: string;
    onCityChange: (city: string) => void;
}

export default function GoldAnalytics({ history, loading, currentPrice, city, onCityChange }: GoldAnalyticsProps) {
    const [karat, setKarat] = useState<'22k' | '24k'>('22k');
    const [timeRange, setTimeRange] = useState<number>(30); // Default 30 days

    const CITIES = ['Chennai', 'Trichy', 'Madurai', 'Pudukkottai'];

    // Filter History based on TimeRange
    const filteredHistory = useMemo(() => {
        if (!history.length) return [];
        return history.slice(-timeRange);
    }, [history, timeRange]);

    // Analytics Logic
    const stats = useMemo(() => {
        if (!filteredHistory.length) return null;

        const prices = filteredHistory.map(h => karat === '24k' ? h.price24k : h.price22k);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

        const startPrice = prices[0];
        const endPrice = prices[prices.length - 1];
        const change = endPrice - startPrice;
        const percentChange = startPrice ? ((change / startPrice) * 100).toFixed(2) : '0';
        const isUp = change >= 0;

        // Recommendation Logic
        let recommendation = 'HOLD';
        let color: 'success' | 'warning' | 'error' | 'info' = 'info';
        let message = '';

        if (endPrice <= minPrice * 1.01) {
            recommendation = 'STRONG BUY';
            color = 'success';
            message = 'Price is at a 30-day low. Excellent opportunity.';
        } else if (endPrice < avgPrice) {
            recommendation = 'BUY';
            color = 'success';
            message = 'Price is below average. Good time to accumulate.';
        } else if (endPrice > maxPrice * 0.99) {
            recommendation = 'WAIT';
            color = 'warning';
            message = 'Price is peaking. Suggest waiting for correction.';
        } else {
            recommendation = 'NEUTRAL';
            color = 'info';
            message = 'Market is stable. Stick to SIP strategy.';
        }

        return { minPrice, maxPrice, avgPrice, change, percentChange, isUp, recommendation, color, message };
    }, [filteredHistory, karat]);

    if (loading && !history.length) {
        return (
            <Box sx={{ p: 2 }}>
                <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    if (!stats || !filteredHistory.length) {
        return (
            <Box p={5} textAlign="center">
                <Typography color="text.secondary">No analytics data available.</Typography>
            </Box>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dateLabel = label ? (() => {
                try { return format(parseISO(label), 'EEE, MMM d'); } catch { return label; }
            })() : 'Unknown Date';

            return (
                <Paper elevation={4} sx={{ p: 1.5, bgcolor: 'rgba(255, 255, 255, 0.95)', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                        {dateLabel}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                        ₹{payload[0].value.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: payload[0].value >= stats.avgPrice ? 'error.main' : 'success.main' }}>
                        {payload[0].value >= stats.avgPrice ? 'Above Avg' : 'Below Avg'}
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Box>
            {/* Controls Toolbar */}
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: 'background.default' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Location</InputLabel>
                            <Select
                                value={city}
                                label="Location"
                                onChange={(e) => onCityChange(e.target.value)}
                                startAdornment={<LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />}
                            >
                                {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                        <ToggleButtonGroup
                            value={karat}
                            exclusive
                            onChange={(_, v) => v && setKarat(v)}
                            fullWidth
                            size="small"
                        >
                            <ToggleButton value="22k">22K</ToggleButton>
                            <ToggleButton value="24k">24K</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                        <ToggleButtonGroup
                            value={timeRange}
                            exclusive
                            onChange={(_, v) => v && setTimeRange(v)}
                            fullWidth
                            size="small"
                        >
                            <ToggleButton value={7}>7D</ToggleButton>
                            <ToggleButton value={30}>30D</ToggleButton>
                            <ToggleButton value={60}>60D</ToggleButton>
                            <ToggleButton value={365}>1Y</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
            </Paper>

            {/* AI Insight Banner */}
            <Card
                sx={{
                    mb: 3,
                    borderRadius: 3,
                    background: stats.color === 'success'
                        ? 'linear-gradient(135deg, #1a4d2e 0%, #2e7d32 100%)'
                        : 'linear-gradient(135deg, #e65100 0%, #ff9800 100%)',
                    color: 'white',
                    boxShadow: 4
                }}
            >
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AutoAwesomeIcon sx={{ color: 'rgba(255,255,255,0.8)' }} />
                            <Typography variant="overline" sx={{ letterSpacing: 1, opacity: 0.9 }}>AI RECOMMENDATION</Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="900" sx={{ mb: 0.5 }}>
                            {stats.recommendation}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {stats.message}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="h3" fontWeight="bold">
                            {stats.percentChange}%
                        </Typography>
                        <Typography variant="caption">in last {timeRange} days</Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* High/Low Stats Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Lowest (Best Buy)</Typography>
                            <Typography variant="h6" fontWeight="bold" color="success.main">
                                ₹{stats.minPrice.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Highest Price</Typography>
                            <Typography variant="h6" fontWeight="bold" color="error.main">
                                ₹{stats.maxPrice.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Average Price</Typography>
                            <Typography variant="h6" fontWeight="bold" color="text.primary">
                                ₹{stats.avgPrice.toLocaleString()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Advanced Chart */}
            <Card sx={{ p: 3, borderRadius: 3, boxShadow: 2, height: 450 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                        Gold Price Trend ({karat.toUpperCase()})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} /> Best Buy Zone
                        </Typography>
                    </Box>
                </Box>

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#FFD700" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => {
                                try { return format(parseISO(str), 'd MMM'); } catch (e) { return str; }
                            }}
                            tick={{ fontSize: 10, fill: '#757575' }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={timeRange > 90 ? 50 : 30}
                            interval="preserveStartEnd"
                            dy={10}
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => `₹${val}`}
                            tick={{ fontSize: 12, fill: '#757575' }}
                            axisLine={false}
                            tickLine={false}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        <ReferenceLine y={stats.minPrice} stroke="#4caf50" strokeDasharray="3 3" label={{ position: 'right', value: 'Low', fill: '#4caf50', fontSize: 10 }} />
                        <ReferenceLine y={stats.maxPrice} stroke="#f44336" strokeDasharray="3 3" label={{ position: 'right', value: 'High', fill: '#f44336', fontSize: 10 }} />

                        <Area
                            type="monotone"
                            dataKey={karat === '24k' ? 'price24k' : 'price22k'}
                            stroke="#FFD700"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                            activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>
        </Box>
    );
}
