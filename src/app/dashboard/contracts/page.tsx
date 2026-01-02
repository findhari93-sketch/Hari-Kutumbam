'use client';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Container,
    Grid,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    Fab,
    CircularProgress,
    Chip,
    Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useAuth } from '@/context/AuthContext';
import { Contract } from '@/types';
import { contractService } from '@/services/contractService';
import ContractForm from '@/components/contracts/ContractForm';
import { Timestamp } from 'firebase/firestore';
import { format, differenceInDays } from 'date-fns';

export default function ContractsPage() {
    return (
        <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
            <ContractsContent />
        </React.Suspense>
    );
}

function ContractsContent() {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);

    useEffect(() => {
        if (user) {
            fetchContracts();
        }
    }, [user]);

    const fetchContracts = async () => {
        if (!user) return;
        try {
            const data = await contractService.getAllContracts();
            setContracts(data.filter(c => !c.isDeleted));
        } catch (error) {
            console.error("Error fetching contracts:", error);
        }
    };

    const handleSave = async (data: Partial<Contract>, file?: File) => {
        if (!user) return;
        try {
            if (editingContract?.id) {
                await contractService.updateContract(editingContract.id, data, user, file);
            } else {
                await contractService.addContract(data as any, user, file);
            }
            setOpenModal(false);
            setEditingContract(null);
            fetchContracts();
        } catch (error) {
            console.error("Error saving contract:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (confirm('Are you sure you want to delete this contract?')) {
            try {
                await contractService.deleteContract(id, user);
                fetchContracts();
            } catch (error) {
                console.error("Error deleting contract:", error);
            }
        }
    };

    const handleCreate = () => {
        setEditingContract(null);
        setOpenModal(true);
    };

    const handleEdit = (contract: Contract) => {
        setEditingContract(contract);
        setOpenModal(true);
    };

    const getExpiryStatus = (expiryDate: Date | Timestamp) => {
        const date = expiryDate instanceof Timestamp ? expiryDate.toDate() : new Date(expiryDate);
        const days = differenceInDays(date, new Date());

        if (days < 0) return { label: 'Expired', color: 'error', days };
        if (days < 30) return { label: 'Expiring Soon', color: 'warning', days };
        return { label: 'Active', color: 'success', days };
    };

    return (
        <Box sx={{ pb: 10, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 10 }}>
                <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" fontWeight="900">Contracts & Documents</Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            Add Contract
                        </Button>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                    {contracts.map((contract) => {
                        const status = getExpiryStatus(contract.expiryDate);
                        const expiryDate = contract.expiryDate instanceof Timestamp ? contract.expiryDate.toDate() : new Date(contract.expiryDate);

                        return (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={contract.id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', borderTop: 4, borderColor: `${status.color}.main` }}>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box display="flex" justifyContent="space-between" mb={1}>
                                            <Chip label={contract.type} size="small" variant="outlined" />
                                            <Chip label={status.label} color={status.color as any} size="small" />
                                        </Box>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom>{contract.title}</Typography>
                                        <Typography variant="subtitle2" color="text.secondary">{contract.provider}</Typography>

                                        <Stack direction="row" justifyContent="space-between" mt={2} sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                                            <Box>
                                                <Typography variant="caption" display="block">Expires</Typography>
                                                <Typography variant="body2" fontWeight="bold">{format(expiryDate, 'dd MMM yyyy')}</Typography>
                                            </Box>
                                            <Box textAlign="right">
                                                <Typography variant="caption" display="block">Remaining</Typography>
                                                <Typography variant="body2" fontWeight="bold" color={status.days < 30 ? 'error.main' : 'text.primary'}>
                                                    {status.days > 0 ? `${status.days} Days` : 'Expired'}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        {contract.description && (
                                            <Typography variant="body2" color="text.secondary" mt={2} sx={{ fontStyle: 'italic' }}>
                                                "{contract.description}"
                                            </Typography>
                                        )}
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                        {contract.documentUrl ? (
                                            <Button size="small" startIcon={<AttachFileIcon />} href={contract.documentUrl} target="_blank">
                                                View Doc
                                            </Button>
                                        ) : (
                                            <Box />
                                        )}
                                        <Box>
                                            <IconButton size="small" onClick={() => handleEdit(contract)}><EditIcon /></IconButton>
                                            <IconButton size="small" onClick={() => contract.id && handleDelete(contract.id)} color="error"><DeleteIcon /></IconButton>
                                        </Box>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                    {contracts.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Typography textAlign="center" color="text.secondary" py={4}>No contracts found. Add your first contract!</Typography>
                        </Grid>
                    )}
                </Grid>
            </Container>

            <Fab
                color="primary"
                sx={{ position: 'fixed', bottom: 16, right: 16, display: { xs: 'flex', sm: 'none' } }}
                onClick={handleCreate}
            >
                <AddIcon />
            </Fab>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingContract ? 'Edit Contract' : 'Add Contract'}</DialogTitle>
                <DialogContent>
                    <ContractForm
                        initialData={editingContract}
                        onSave={handleSave}
                        onCancel={() => setOpenModal(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
}
