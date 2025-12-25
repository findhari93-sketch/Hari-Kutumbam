import React from 'react';
import { Box, Card, CardContent, Typography, IconButton, Grid, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import { BankEntity } from '../../services/bankService';

interface EntityListProps {
    entities: BankEntity[];
    onSelect: (entity: BankEntity) => void;
    onEdit: (entity: BankEntity) => void;
}

export default function EntityList({ entities, onSelect, onEdit }: EntityListProps) {
    if (entities.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <Typography>No family members or organizations found.</Typography>
                <Typography variant="caption">Add one to get started.</Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={2}>
            {entities.map((entity) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={entity.id}>
                    <Card
                        onClick={() => onSelect(entity)}
                        sx={{
                            cursor: 'pointer',
                            borderRadius: 3,
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.02)' },
                            background: entity.type === 'Organization'
                                ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' // Orange for Org
                                : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', // Blue for Person
                            color: 'white',
                            minHeight: 140
                        }}
                    >
                        {/* Decorative Circle */}
                        <Box sx={{
                            position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                            borderRadius: '50%', background: 'rgba(255,255,255,0.2)'
                        }} />

                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ p: 0.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                                        {entity.type === 'Organization' ? <BusinessIcon /> : <PersonIcon />}
                                    </Box>
                                    <Chip
                                        label={entity.type}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', height: 20, fontSize: '0.65rem' }}
                                    />
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); onEdit(entity); }}
                                    sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.1)' }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <Typography variant="h5" fontWeight="bold" sx={{ mt: 2, mb: 0.5 }}>
                                {entity.name}
                            </Typography>

                            {entity.pan && (
                                <Typography variant="caption" sx={{ letterSpacing: 1, opacity: 0.9 }}>
                                    PAN: {entity.pan}
                                </Typography>
                            )}

                            {entity.type === 'Organization' && entity.meta?.regNumber && (
                                <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                                    Reg: {entity.meta.regNumber}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
}
