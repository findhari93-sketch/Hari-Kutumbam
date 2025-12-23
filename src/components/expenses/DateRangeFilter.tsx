'use client';
import { Box, Paper, IconButton, Typography, Badge } from '@mui/material';
import React, { useState } from 'react';
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { enUS } from 'date-fns/locale';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';

interface DateRangeFilterProps {
    dateRange: Range;
    onChange: (range: Range) => void;
}

export default function DateRangeFilter({ dateRange, onChange }: DateRangeFilterProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (ranges: RangeKeyDict) => {
        onChange(ranges.selection);
    };

    // Preset Ranges for Enterprise feel
    const staticRanges = [
        {
            label: 'Today',
            range: () => ({ startDate: new Date(), endDate: new Date() }),
            isSelected: (range: Range) => false // Simplification
        },
        {
            label: 'This Week',
            range: () => ({ startDate: startOfWeek(new Date()), endDate: endOfWeek(new Date()) }),
            isSelected: (range: Range) => false
        },
        {
            label: 'Last 7 Days',
            range: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }),
            isSelected: (range: Range) => false
        },
        {
            label: 'This Month',
            range: () => ({ startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()) }),
            isSelected: (range: Range) => false
        },
        {
            label: 'All Time',
            range: () => ({ startDate: new Date(2020, 0, 1), endDate: endOfMonth(new Date()) }),
            isSelected: (range: Range) => false
        }
    ];

    return (
        <>
            <IconButton onClick={() => setOpen(!open)} color="primary">
                <Badge variant="dot" color="secondary" invisible={!open}>
                    <CalendarMonthIcon />
                </Badge>
            </IconButton>

            {open && (
                <Box sx={{
                    position: 'absolute',
                    top: '60px',
                    right: '16px',
                    zIndex: 1300,
                    boxShadow: 3,
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'background.paper'
                }}>
                    <DateRangePicker
                        ranges={[dateRange]}
                        onChange={handleSelect}
                        months={1}
                        direction="vertical"
                        scroll={{ enabled: true }}
                        rangeColors={['#1976d2']} // Primary Color
                        locale={enUS}
                        staticRanges={staticRanges}
                        inputRanges={[]}
                    />
                    {/* Additional Custom Toolbar could go here if using pure DateRange component */}
                </Box>
            )}
        </>
    );
}
