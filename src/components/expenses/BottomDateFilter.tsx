'use client';
import React from 'react';
import {
    Paper,
    ToggleButton,
    ToggleButtonGroup,
    styled,
    Box
} from '@mui/material';

interface BottomDateFilterProps {
    currentPreset: string | null;
    onSelectPreset: (preset: string) => void;
}

const SolidToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    width: '100%',
    display: 'flex',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    overflow: 'hidden',
    boxShadow: theme.shadows[2],
    '& .MuiToggleButton-root': {
        flex: 1,
        border: 'none',
        borderRight: `1px solid ${theme.palette.divider}`,
        borderRadius: 0,
        fontWeight: 600,
        fontSize: '0.75rem',
        padding: '8px 0',
        color: theme.palette.text.secondary,
        textTransform: 'none',
        '&:last-of-type': {
            borderRight: 'none'
        },
        '&.Mui-selected': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
                backgroundColor: theme.palette.primary.dark,
            }
        },
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        }
    }
}));

export default function BottomDateFilter({
    currentPreset,
    onSelectPreset
}: BottomDateFilterProps) {

    const presets = ['7D', '30D', '12W', '6M', '1Y'];

    return (
        <Paper
            elevation={4}
            sx={{
                position: 'fixed',
                bottom: 20,
                left: { xs: 16, md: '50%' },
                right: { xs: 16, md: 'auto' },
                transform: { xs: 'none', md: 'translateX(-50%)' },
                width: { xs: 'auto', md: 500 }, // Fixed concise width on desktop
                zIndex: 1300, // High enough to be above content
                bgcolor: 'transparent', // Group handles bg
                display: 'flex',
                justifyContent: 'center',
                borderRadius: 3
            }}
        >
            <SolidToggleButtonGroup
                value={currentPreset}
                exclusive
                onChange={(e, value) => {
                    if (value) {
                        onSelectPreset(value);
                    }
                }}
                aria-label="date range"
                size="small"
            >
                {presets.map(p => (
                    <ToggleButton key={p} value={p}>
                        {p}
                    </ToggleButton>
                ))}
            </SolidToggleButtonGroup>
        </Paper>
    );
}
