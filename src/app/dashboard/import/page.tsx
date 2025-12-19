'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Chip,
    Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { parseBankCSV, DraftTransaction } from '@/services/csvParser';

export default function ImportPage() {
    const [transactions, setTransactions] = useState<DraftTransaction[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLoading(true);
            try {
                const data = await parseBankCSV(e.target.files[0]);
                setTransactions(data);
                // Default select all
                setSelected(data.map((_, idx) => idx));
            } catch (error) {
                console.error(error);
                alert('Error parsing CSV');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggle = (index: number) => {
        if (selected.includes(index)) {
            setSelected(selected.filter(i => i !== index));
        } else {
            setSelected([...selected, index]);
        }
    }

    const handleImport = () => {
        const toImport = transactions.filter((_, idx) => selected.includes(idx));
        console.log('Importing:', toImport);
        alert(`Imported ${toImport.length} transactions successfully!`);
        setTransactions([]);
        setSelected([]);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Import Bank Statement
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Upload your bank statement (CSV) to reconcile standard transactions.
            </Typography>

            <Box sx={{ mb: 4 }}>
                <Button
                    variant="contained"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    size="large"
                >
                    Upload CSV
                    <input hidden accept=".csv" type="file" onChange={handleFileUpload} />
                </Button>
            </Box>

            {transactions.length > 0 && (
                <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">{transactions.length} Transactions Found</Typography>
                        <Button variant="contained" color="success" onClick={handleImport}>
                            Confirm Import ({selected.length})
                        </Button>
                    </Box>

                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selected.length === transactions.length}
                                            indeterminate={selected.length > 0 && selected.length < transactions.length}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelected(transactions.map((_, i) => i));
                                                else setSelected([]);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map((row, index) => {
                                    const isSelected = selected.includes(index);
                                    return (
                                        <TableRow
                                            hover
                                            onClick={() => handleToggle(index)}
                                            role="checkbox"
                                            aria-checked={isSelected}
                                            tabIndex={-1}
                                            key={index}
                                            selected={isSelected}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox checked={isSelected} />
                                            </TableCell>
                                            <TableCell>{row.date}</TableCell>
                                            <TableCell>{row.description}</TableCell>
                                            <TableCell>₹{row.amount}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.type.toUpperCase()}
                                                    color={row.type === 'income' ? 'success' : 'error'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {/* Duplicate Detection Logic Mock */}
                                                <Chip label="New" color="primary" size="small" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {loading && <Typography>Parsing file...</Typography>}

            <Alert severity="info" sx={{ mt: 2 }}>
                Note: Currently supports CSV format. PDF support coming soon via specialized parsers.
            </Alert>
        </Box>
    );
}
