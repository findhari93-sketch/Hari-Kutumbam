'use client';
import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Button,
    Chip,
    Stack,
    Divider,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { categoryService } from '@/services/categoryService';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types';

export default function CategoriesPage() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [open, setOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [subcats, setSubcats] = useState<string[]>([]);
    const [newSubcat, setNewSubcat] = useState('');
    const [type, setType] = useState<'expense' | 'income'>('expense');

    useEffect(() => {
        if (user) loadCategories();
    }, [user]);

    const loadCategories = async () => {
        if (!user) return;
        try {
            const data = await categoryService.getUserCategories(user.uid);
            setCategories(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpen = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setName(category.name);
            setSubcats(category.subcategories || []);
            setType(category.type);
        } else {
            setEditingCategory(null);
            setName('');
            setSubcats([]);
            setType('expense');
        }
        setOpen(true);
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            const payload: Omit<Category, 'id' | 'audit'> = {
                name,
                subcategories: subcats,
                type,
                userId: user.uid,
                // icon: ...
            };

            if (editingCategory?.id) {
                await categoryService.updateCategory(editingCategory.id, payload, user);
            } else {
                await categoryService.addCategory(payload, user);
            }
            setOpen(false);
            loadCategories();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user || !confirm('Delete this category?')) return;
        await categoryService.deleteCategory(id, user);
        loadCategories();
    };

    const addSubcat = () => {
        if (newSubcat.trim()) {
            setSubcats([...subcats, newSubcat.trim()]);
            setNewSubcat('');
        }
    };

    const removeSubcat = (index: number) => {
        setSubcats(subcats.filter((_, i) => i !== index));
    };

    return (
        <Box sx={{ p: 2, pb: 10 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Manage Categories</Typography>

            <List>
                {categories.map((cat) => (
                    <Paper key={cat.id} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                        <ListItem
                            secondaryAction={
                                <Box>
                                    <IconButton onClick={() => handleOpen(cat)}><EditIcon /></IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(cat.id!)}><DeleteIcon /></IconButton>
                                </Box>
                            }
                            sx={{ bgcolor: 'action.hover' }}
                        >
                            <ListItemText
                                primary={<Typography variant="h6">{cat.name}</Typography>}
                                secondary={cat.type.toUpperCase()}
                            />
                        </ListItem>
                        <Box sx={{ p: 2, pt: 0 }}>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {cat.subcategories.map((sub, i) => (
                                    <Chip key={i} label={sub} size="small" />
                                ))}
                                {cat.subcategories.length === 0 && <Typography variant="caption" color="text.secondary">No subcategories</Typography>}
                            </Stack>
                        </Box>
                    </Paper>
                ))}
            </List>

            <Fab
                color="primary"
                sx={{ position: 'fixed', bottom: 80, right: 16 }}
                onClick={() => handleOpen()}
            >
                <AddIcon />
            </Fab>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select value={type} label="Type" onChange={(e) => setType(e.target.value as 'expense' | 'income')}>
                                <MenuItem value="expense">Expense</MenuItem>
                                <MenuItem value="income">Income</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Category Name"
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <Divider textAlign="left">Subcategories</Divider>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                label="Add Subcategory"
                                fullWidth
                                size="small"
                                value={newSubcat}
                                onChange={(e) => setNewSubcat(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubcat())}
                            />
                            <Button variant="contained" onClick={addSubcat}>Add</Button>
                        </Box>

                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {subcats.map((sub, i) => (
                                <Chip
                                    key={i}
                                    label={sub}
                                    onDelete={() => removeSubcat(i)}
                                />
                            ))}
                        </Stack>
                    </Box>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handleSave}>Save</Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
