'use client';
import { Box, Paper, IconButton, Typography, Badge, Popover } from '@mui/material';
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
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

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
            <IconButton onClick={handleClick} color="primary">
                <Badge variant="dot" color="secondary" invisible={!dateRange.startDate}>
                    <CalendarMonthIcon />
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: { borderRadius: 2, overflow: 'hidden' }
                }}
            >
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
            </Popover>
        </>
    );
}
