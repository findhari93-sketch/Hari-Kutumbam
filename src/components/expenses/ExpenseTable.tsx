'use client';
import { useMemo } from 'react';
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';
import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Expense } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

interface ExpenseTableProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
}

export default function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
    const columns = useMemo<MRT_ColumnDef<Expense>[]>(
        () => [
            {
                id: 'date',
                header: 'Date',
                enableColumnFilter: false, // Disable column filter since we have global date range
                accessorFn: (row) => {
                    const d = row.date instanceof Timestamp ? row.date.toDate() : new Date(row.date);
                    return d;
                },
                Cell: ({ cell }) => {
                    const d = cell.getValue<Date>();
                    return d ? format(d, 'dd-MMM-yy').toUpperCase() : '';
                },
                size: 100,
            },
            {
                accessorKey: 'category',
                header: 'Category',
                size: 120,
            },
            {
                accessorKey: 'description',
                header: 'Description',
                size: 200,
            },
            {
                accessorKey: 'paymentMode',
                header: 'Mode',
                size: 90,
            },
            {
                accessorKey: 'source',
                header: 'Source',
                size: 100,
            },
            {
                accessorKey: 'amount',
                header: 'Amount',
                size: 100,
                filterVariant: 'range',
                Cell: ({ cell }) => (
                    <Typography fontWeight="bold" color="error.main">
                        ₹{cell.getValue<number>()?.toLocaleString()}
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
        positionActionsColumn: 'last',
        initialState: {
            density: 'compact',
            pagination: { pageSize: 20, pageIndex: 0 },
            sorting: [{ id: 'date', desc: true }],
        },
        muiTablePaperProps: {
            elevation: 0,
            sx: { border: '1px solid #e0e0e0' }
        },
        renderRowActions: ({ row }) => (
            <Box sx={{
                display: 'flex',
                gap: '0.5rem',
                opacity: 0,
                transition: 'opacity 0.2s ease-in-out',
                '.MuiTableRow-root:hover &': {
                    opacity: 1
                }
            }}>
                <Tooltip title="Edit">
                    <IconButton onClick={() => onEdit(row.original)} size="small">
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton
                        color="error"
                        onClick={() => row.original.id && onDelete(row.original.id)}
                        size="small"
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
    });

    return <MaterialReactTable table={table} />;
}
