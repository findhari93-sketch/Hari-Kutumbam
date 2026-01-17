'use client';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    Fab,
    CircularProgress,
    Card,
    CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '@/context/AuthContext';
import { Income } from '@/types';
import { incomeService } from '@/services/incomeService';
import IncomeForm from '@/components/income/IncomeForm';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export default function IncomePage() {
    return (
        <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
            <IncomeContent />
        </React.Suspense>
    );
}

function IncomeContent() {
    const { user } = useAuth();
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);

    useEffect(() => {
        if (user) {
            fetchIncomes();
        }
    }, [user]);

    const fetchIncomes = async () => {
        if (!user) return;
        try {
            const data = await incomeService.getAllIncomes(user.uid);
            setIncomes(data.filter(i => !i.isDeleted));
        } catch (error) {
            console.error("Error fetching incomes:", error);
        }
    };

    const handleSave = async (data: Partial<Income>) => {
        if (!user) return;
        try {
            if (editingIncome?.id) {
                await incomeService.updateIncome(editingIncome.id, data, user);
            } else {
                await incomeService.addIncome(data as any, user);
            }
            setOpenModal(false);
            setEditingIncome(null);
            fetchIncomes();
        } catch (error) {
            console.error("Error saving income:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (confirm('Are you sure you want to delete this income?')) {
            try {
                await incomeService.deleteIncome(id, user);
                fetchIncomes();
            } catch (error) {
                console.error("Error deleting income:", error);
            }
        }
    };

    const handleCreate = () => {
        setEditingIncome(null);
        setOpenModal(true);
    };

    const handleEdit = (income: Income) => {
        setEditingIncome(income);
        setOpenModal(true);
    };

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    return (
        <Box sx={{ pb: 10, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, zIndex: 10 }}>
                <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h5" fontWeight="900">Income Overview</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Received: <strong>₹{totalIncome.toLocaleString()}</strong>
                            </Typography>
                        </Box>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            Add Income
                        </Button>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                {/* Desktop Table */}
                <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' }, mb: 4 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Source</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {incomes.map((income) => (
                                <TableRow key={income.id}>
                                    <TableCell>
                                        {format(income.date instanceof Timestamp ? income.date.toDate() : new Date(income.date), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell>{income.source}</TableCell>
                                    <TableCell>{income.description}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                        ₹{income.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(income)}><EditIcon /></IconButton>
                                        <IconButton size="small" onClick={() => income.id && handleDelete(income.id)} color="error"><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {incomes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">No income records found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Mobile Cards */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                    {incomes.map((income) => (
                        <Card key={income.id}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">{income.source}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {format(income.date instanceof Timestamp ? income.date.toDate() : new Date(income.date), 'dd MMM yyyy')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" color="success.main" fontWeight="bold">
                                        ₹{income.amount.toLocaleString()}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ mt: 1 }}>{income.description}</Typography>
                                <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEdit(income)}>Edit</Button>
                                    <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => income.id && handleDelete(income.id)}>Delete</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                    {incomes.length === 0 && (
                        <Typography textAlign="center" color="text.secondary" py={4}>No income records found.</Typography>
                    )}
                </Box>
            </Container>

            <Fab
                color="primary"
                sx={{ position: 'fixed', bottom: 16, right: 16, display: { xs: 'flex', sm: 'none' } }}
                onClick={handleCreate}
            >
                <AddIcon />
            </Fab>

            <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingIncome ? 'Edit Income' : 'Add Income'}</DialogTitle>
                <DialogContent>
                    <IncomeForm
                        initialData={editingIncome}
                        onSave={handleSave}
                        onCancel={() => setOpenModal(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
}
