import { useState } from 'react';
import { Button, Box, Typography, Alert, Paper } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Category } from '@/types';
import { categoryService } from '@/services/categoryService';

export default function CategoryImport({ onImportComplete, userId }: { onImportComplete: () => void, userId: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTemplateDownload = () => {
        const csvContent = "Category,Type,Subcategories\nFood,expense,\"Groceries,Dining Out\"\nSalary,income,";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        saveAs(blob, "category_template.csv");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleImport = () => {
        if (!file) return;
        setLoading(true);
        setError('');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const categories: Category[] = [];
                    // Validate and transform
                    for (const row of results.data as any[]) {
                        if (!row.Category || !row.Type) continue; // Basic validation

                        const subcategories = row.Subcategories
                            ? row.Subcategories.split(',').map((s: string) => s.trim()).filter(Boolean)
                            : [];

                        categories.push({
                            name: row.Category,
                            type: row.Type.toLowerCase() as 'expense' | 'income',
                            subcategories,
                            userId, // Service will overwrite/ignore? Service method takes userId param.
                            audit: {} as any // Service handles audit
                        } as Category);
                    }

                    if (categories.length === 0) {
                        setError('No valid categories found.');
                        setLoading(false);
                        return;
                    }

                    await categoryService.batchCreateCategories(categories, userId);
                    setSuccess(`Successfully imported ${categories.length} categories.`);
                    setFile(null);
                    onImportComplete();
                } catch (err) {
                    console.error(err);
                    setError('Failed to import categories.');
                } finally {
                    setLoading(false);
                }
            },
            error: (err) => {
                setError('Error parsing CSV: ' + err.message);
                setLoading(false);
            }
        });
    };

    return (
        <Paper sx={{ p: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Import Categories</Typography>
                <Button startIcon={<DownloadIcon />} onClick={handleTemplateDownload} variant="outlined" size="small">
                    Download Template
                </Button>
            </Box>

            <Box border="2px dashed #ccc" p={4} textAlign="center" borderRadius={2} mb={2}>
                <input
                    accept=".csv"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={handleFileUpload}
                />
                <label htmlFor="raised-button-file">
                    <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}>
                        Select CSV File
                    </Button>
                </label>
                {file && <Typography mt={2}>{file.name}</Typography>}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleImport}
                disabled={!file || loading}
            >
                {loading ? 'Importing...' : 'Start Import'}
            </Button>
        </Paper>
    );
}
