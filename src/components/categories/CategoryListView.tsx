'use client';
import { useState } from 'react';
import {
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Chip,
    IconButton,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { Category } from '@/types';
import { categoryService } from '@/services/categoryService';

interface CategoryListViewProps {
    categories: Category[];
    userId: string;
    onUpdate: () => void;
}

export default function CategoryListView({ categories, userId, onUpdate }: CategoryListViewProps) {
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [subcats, setSubcats] = useState('');

    const handleOpenCreate = () => {
        setEditCategory(null);
        setName('');
        setType('expense');
        setSubcats('');
        setOpenDialog(true);
    };

    const handleOpenEdit = (cat: Category) => {
        setEditCategory(cat);
        setName(cat.name);
        setType(cat.type);
        setSubcats(cat.subcategories.join(', '));
        setOpenDialog(true);
    };

    const handleSave = async () => {
        try {
            const subArray = subcats.split(',').map(s => s.trim()).filter(Boolean);

            if (editCategory && editCategory.id) {
                // Update
                await categoryService.updateCategory(editCategory.id, {
                    name,
                    type,
                    subcategories: subArray
                }, { uid: userId });
            } else {
                // Create
                await categoryService.addCategory({
                    name,
                    type,
                    subcategories: subArray,
                    userId
                }, { uid: userId });
            }
            setOpenDialog(false);
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this category?')) {
            await categoryService.deleteCategory(id, { uid: userId });
            onUpdate();
        }
    };

    return (
        <Box>
            <Box mb={2}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                    Add Category
                </Button>
            </Box>

            {categories.map((cat) => (
                <Paper key={cat.id} sx={{ mb: 1, display: 'flex', alignItems: 'center', p: 1 }}>
                    <Box flexGrow={1}>
                        <Accordion sx={{ boxShadow: 'none', background: 'transparent', '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box>
                                    <Typography fontWeight="bold">{cat.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{cat.type.toUpperCase()}</Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="subtitle2" gutterBottom>Subcategories:</Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    {cat.subcategories.length > 0 ? (
                                        cat.subcategories.map((sub, idx) => (
                                            <Chip key={idx} label={sub} size="small" />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">No subcategories</Typography>
                                    )}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                    <Box display="flex" gap={1} mr={1}>
                        <IconButton size="small" onClick={() => handleOpenEdit(cat)}>
                            <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => { if (cat.id) handleDelete(cat.id); }}>
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                </Paper>
            ))}

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField
                            label="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select value={type} label="Type" onChange={(e) => setType(e.target.value as any)}>
                                <MenuItem value="expense">Expense</MenuItem>
                                <MenuItem value="income">Income</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Subcategories (comma separated)"
                            value={subcats}
                            onChange={(e) => setSubcats(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            helperText="Example: Groceries, Vegetables, Fruits"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
