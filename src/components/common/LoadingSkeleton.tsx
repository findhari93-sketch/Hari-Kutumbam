import React from 'react';
import { Skeleton, Box, Grid, Paper } from '@mui/material';

interface LoadingSkeletonProps {
    type?: 'dashboard' | 'list' | 'text' | 'card';
}

export default function LoadingSkeleton({ type = 'list' }: LoadingSkeletonProps) {
    if (type === 'dashboard') {
        return (
            <Box>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {[1, 2, 3].map((item) => (
                        <Grid size={{ xs: 12, md: 4 }} key={item}>
                            <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 4 }} />
                        </Grid>
                    ))}
                </Grid>
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
            </Box>
        );
    }

    if (type === 'card') {
        return (
            <Grid container spacing={2}>
                {[1, 2, 3, 4].map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item}>
                        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4 }} />
                    </Grid>
                ))}
            </Grid>
        );
    }

    if (type === 'text') {
        return (
            <Box sx={{ width: '100%' }}>
                <Skeleton width="60%" height={40} sx={{ mb: 2 }} />
                <Skeleton />
                <Skeleton width="80%" />
            </Box>
        );
    }

    // Default 'list'
    return (
        <Paper sx={{ p: 2, borderRadius: 4 }}>
            {[1, 2, 3, 4, 5].map((item) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                    <Box sx={{ width: '100%' }}>
                        <Skeleton width="40%" />
                        <Skeleton width="80%" />
                    </Box>
                </Box>
            ))}
        </Paper>
    );
}
