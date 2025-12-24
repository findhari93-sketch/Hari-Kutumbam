'use client';
import { useMemo, useState, useEffect } from 'react';
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';
import {
    IconButton,
    Box,
    Typography,
    useTheme,
    useMediaQuery,
    Card,
    CardContent,
    Chip,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import CategoryIcon from '@mui/icons-material/Category';
import PaymentsIcon from '@mui/icons-material/Payments';

import { Expense } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface ExpenseTableProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
}

const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('food') || lower.includes('dining')) return <RestaurantIcon fontSize="inherit" />;
    if (lower.includes('shopping') || lower.includes('clothes')) return <ShoppingBagIcon fontSize="inherit" />;
    if (lower.includes('fuel') || lower.includes('transport')) return <LocalGasStationIcon fontSize="inherit" />;
    if (lower.includes('salary') || lower.includes('income')) return <PaymentsIcon fontSize="inherit" />;
    return <CategoryIcon fontSize="inherit" />;
};

export default function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

    useEffect(() => {
        setViewMode(isMobile ? 'card' : 'table');
    }, [isMobile]);

    const columns = useMemo<MRT_ColumnDef<Expense>[]>(
        () => [
            {
                id: 'date',
                header: 'Date',
                accessorFn: (row) => {
                    const d = row.date instanceof Timestamp ? row.date.toDate() : new Date(row.date);
                    return d;
                },
                Cell: ({ cell }) => {
                    const d = cell.getValue<Date>();
                    return d ? (
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {format(d, 'dd-MMM')}
                        </Typography>
                    ) : '';
                },
                size: 80,
            },
            {
                accessorKey: 'category',
                header: 'Cat',
                size: 100,
                Cell: ({ cell }) => (
                    <Chip
                        icon={getCategoryIcon(cell.getValue<string>())}
                        label={cell.getValue<string>()}
                        size="small"
                        variant="outlined"
                        sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            border: 'none',
                            bgcolor: 'action.hover',
                            '& .MuiChip-icon': { fontSize: '1rem' }
                        }}
                    />
                )
            },
            {
                accessorKey: 'description',
                header: 'Desc',
                size: 150,
                Cell: ({ cell }) => (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cell.getValue<string>()}
                    </Typography>
                )
            },
            {
                accessorKey: 'paymentMode',
                header: 'Mode',
                size: 70,
                Cell: ({ cell }) => (
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {cell.getValue<string>()}
                    </Typography>
                )
            },
            {
                accessorKey: 'amount',
                header: '₹',
                size: 80,
                filterVariant: 'range',
                Cell: ({ cell }) => (
                    <Typography fontWeight="bold" color="error.main" sx={{ fontSize: '0.75rem' }}>
                        {cell.getValue<number>()?.toLocaleString()}
                    </Typography>
                ),
            },
        ],
        [],
    );

    const table = useMaterialReactTable({
        columns,
        data: expenses,
        enableRowActions: true,
        enableColumnPinning: true,
        enableStickyHeader: true,
        enableGlobalFilter: true,
        positionGlobalFilter: 'left',
        initialState: {
            density: 'compact',
            pagination: { pageSize: 20, pageIndex: 0 },
            sorting: [{ id: 'date', desc: true }],
            columnPinning: { left: ['date'], right: ['mrt-row-actions'] },
        },
        muiTablePaperProps: {
            elevation: 0,
            sx: {
                border: '1px solid #e0e0e0',
                maxWidth: '100vw',
                overflow: 'hidden'
            }
        },
        muiTableContainerProps: {
            sx: { maxHeight: '70vh' }
        },
        muiTableHeadCellProps: {
            sx: {
                fontSize: '0.75rem',
                padding: '4px 8px',
                fontWeight: 'bold',
                backgroundColor: '#f5f5f5'
            }
        },
        muiTableBodyCellProps: {
            sx: {
                fontSize: '0.75rem',
                padding: '4px 8px',
            }
        },
        positionActionsColumn: 'last',
        displayColumnDefOptions: {
            'mrt-row-actions': {
                header: '',
                size: 60,
                muiTableBodyCellProps: {
                    sx: { padding: '0px', textAlign: 'center' }
                }
            },
        },
        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: 0, justifyContent: 'center' }}>
                <IconButton onClick={() => onEdit(row.original)} size="small" sx={{ padding: '4px' }}>
                    <EditIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
                <IconButton
                    color="error"
                    onClick={() => row.original.id && onDelete(row.original.id)}
                    size="small"
                    sx={{ padding: '4px' }}
                >
                    <DeleteIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
            </Box>
        ),
    });

    return (
        <Box sx={{ maxWidth: '100vw', overflowX: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                    Recent Transactions
                </Typography>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, v) => v && setViewMode(v)}
                    size="small"
                    aria-label="view mode"
                    sx={{ ml: 'auto' }}
                >
                    <ToggleButton value="card" aria-label="card view" sx={{ py: 0.5 }}>
                        <GridViewIcon fontSize="small" sx={{ mr: 1 }} /> Cards
                    </ToggleButton>
                    <ToggleButton value="table" aria-label="table view" sx={{ py: 0.5 }}>
                        <ViewListIcon fontSize="small" sx={{ mr: 1 }} /> Table
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {viewMode === 'card' ? (
                <Stack spacing={2} sx={{ mt: 2 }}>
                    {expenses.map((expense) => {
                        const date = expense.date instanceof Timestamp ? expense.date.toDate() : new Date(expense.date);
                        return (
                            <Card key={expense.id} elevation={2} sx={{ borderRadius: 3, transition: '0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
                                <CardContent sx={{ p: '12px !important' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Box sx={{
                                                bgcolor: 'primary.light',
                                                color: 'primary.contrastText',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                width: 32, height: 32, alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {getCategoryIcon(expense.category)}
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2, fontSize: '0.9rem' }}>{expense.category}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                    {format(date, 'EEE, dd MMM')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                                            ₹{expense.amount.toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 1, pl: 5.5 }}>
                                        <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.85rem' }}>{expense.description}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            {expense.paymentMode} • {expense.source}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid', borderColor: 'divider', pt: 0.5, mt: 1, gap: 1 }}>
                                        <IconButton size="small" onClick={() => onEdit(expense)} color="inherit">
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => expense.id && onDelete(expense.id)} color="error">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        )
                    })}
                </Stack>
            ) : (
                <MaterialReactTable table={table} />
            )}
        </Box>
    );
}
