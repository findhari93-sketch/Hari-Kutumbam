import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, FormControl, Select, MenuItem, Typography, Button } from '@mui/material';
import { startOfYear, startOfMonth, subMonths, startOfWeek } from 'date-fns';

export type DateRange = 'this-month' | 'last-month' | 'last-3-months' | 'this-year' | 'all-time';

interface ReportFiltersProps {
    currentRange: DateRange;
    onRangeChange: (range: DateRange) => void;
    onExport?: () => void;
}

export default function ReportFilters({ currentRange, onRangeChange, onExport }: ReportFiltersProps) {

    const handleChange = (
        event: React.MouseEvent<HTMLElement>,
        newRange: DateRange | null,
    ) => {
        if (newRange !== null) {
            onRangeChange(newRange);
        }
    };

    return (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5" fontWeight="bold">Analytics & Reports</Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
                {onExport && (
                    <Button variant="outlined" onClick={onExport}>
                        Export CSV
                    </Button>
                )}
                <ToggleButtonGroup
                    value={currentRange}
                    exclusive
                    onChange={handleChange}
                    aria-label="date range"
                    color="primary"
                    size="small"
                    sx={{ bgcolor: 'background.paper' }}
                >
                    <ToggleButton value="this-month">This Month</ToggleButton>
                    <ToggleButton value="last-month">Last Month</ToggleButton>
                    <ToggleButton value="last-3-months">3 Months</ToggleButton>
                    <ToggleButton value="this-year">This Year</ToggleButton>
                    <ToggleButton value="all-time">All Time</ToggleButton>
                </ToggleButtonGroup>
            </Box>
        </Box>
    );
}
