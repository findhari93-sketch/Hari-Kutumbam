'use client';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Chip,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    FormControl,
    Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import ScaleIcon from '@mui/icons-material/Scale';

import { giftPlanningService, GiftPlan } from '@/services/giftPlanningService';
import { useAuth } from '@/context/AuthContext';

export default function GiftPlanner() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<GiftPlan[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPlan, setEditingPlan] = useState<GiftPlan | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<GiftPlan>>({
        recipientName: '',
        recipientContact: '',
        plannedWeight: 0,
        occasion: '',
        status: 'Planned',
        notes: ''
    });
    // For date, we'll store as string in form temporarily
    const [dateStr, setDateStr] = useState('');

    useEffect(() => {
        if (user) loadPlans();
    }, [user]);

    const loadPlans = async () => {
        if (!user) return;
        const data = await giftPlanningService.getPlans(user.uid);
        // Sort by date coming up
        data.sort((a, b) => a.targetDate - b.targetDate);
        setPlans(data);
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            const payload = {
                ...formData,
                targetDate: new Date(dateStr).getTime()
            } as any; // Cast for simplicity

            if (editingPlan && editingPlan.id) {
                await giftPlanningService.updatePlan(editingPlan.id, payload);
            } else {
                await giftPlanningService.addPlan(user.uid, payload);
            }
            setOpenDialog(false);
            loadPlans();
            resetForm();
        } catch (e) {
            console.error(e);
            alert('Failed to save plan');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this plan?')) return;
        await giftPlanningService.deletePlan(id);
        loadPlans();
    };

    const openEdit = (plan: GiftPlan) => {
        setEditingPlan(plan);
        setFormData({
            recipientName: plan.recipientName,
            recipientContact: plan.recipientContact,
            plannedWeight: plan.plannedWeight,
            occasion: plan.occasion,
            status: plan.status,
            notes: plan.notes
        });
        setDateStr(new Date(plan.targetDate).toISOString().split('T')[0]);
        setOpenDialog(true);
    };

    const resetForm = () => {
        setEditingPlan(null);
        setFormData({ recipientName: '', recipientContact: '', plannedWeight: 0, occasion: '', status: 'Planned', notes: '' });
        setDateStr('');
    };

    const totalPlannedWeight = plans.filter(p => p.status === 'Planned').reduce((sum, p) => sum + p.plannedWeight, 0);

    return (
        <Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">Future Gifting Plans</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Total Gold Commitment: <Box component="span" fontWeight="bold" color="primary.main">{totalPlannedWeight}g</Box>
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { resetForm(); setOpenDialog(true); }}
                    sx={{ borderRadius: 3 }}
                >
                    Plan Gift
                </Button>
            </Box>

            <Grid container spacing={2}>
                {plans.map(plan => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.id}>
                        <Card sx={{
                            borderRadius: 3,
                            borderLeft: '5px solid',
                            borderColor: plan.status === 'Gifted' ? 'success.main' : plan.status === 'Purchased' ? 'info.main' : 'warning.main',
                            position: 'relative',
                            overflow: 'visible'
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">{plan.recipientName}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <EventIcon fontSize="inherit" /> {plan.occasion} • {new Date(plan.targetDate).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={plan.status}
                                        color={plan.status === 'Gifted' ? 'success' : plan.status === 'Purchased' ? 'info' : 'default'}
                                        size="small"
                                    />
                                </Box>

                                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ScaleIcon color="action" />
                                        <Typography fontWeight="bold">{plan.plannedWeight}g</Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">Target</Typography>
                                </Box>

                                {plan.notes && (
                                    <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                                        "{plan.notes}"
                                    </Typography>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                                    <IconButton size="small" onClick={() => openEdit(plan)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => plan.id && handleDelete(plan.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {!plans.length && (
                <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
                    <Typography variant="h6">No plans yet</Typography>
                    <Typography variant="body2">Start planning your future gifts to manage gold requirements.</Typography>
                </Box>
            )}

            {/* Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingPlan ? 'Edit Plan' : 'New Gift Plan'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Recipient Name"
                            fullWidth
                            value={formData.recipientName}
                            onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                        />
                        <TextField
                            label="Recipient Contact (Optional)"
                            fullWidth
                            value={formData.recipientContact}
                            onChange={e => setFormData({ ...formData, recipientContact: e.target.value })}
                        />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Target Weight (g)"
                                    type="number"
                                    fullWidth
                                    value={formData.plannedWeight}
                                    onChange={e => setFormData({ ...formData, plannedWeight: Number(e.target.value) })}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Target Date"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={dateStr}
                                    onChange={e => setDateStr(e.target.value)}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            label="Occasion (e.g., Wedding in 2026)"
                            fullWidth
                            value={formData.occasion}
                            onChange={e => setFormData({ ...formData, occasion: e.target.value })}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={formData.status}
                                label="Status"
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <MenuItem value="Planned">Planned</MenuItem>
                                <MenuItem value="Purchased">Purchased (In Vault)</MenuItem>
                                <MenuItem value="Gifted">Gifted (Done)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Notes"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save Plan</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
