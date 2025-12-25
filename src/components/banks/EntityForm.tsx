import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    useMediaQuery,
    useTheme,
    Drawer,
    Typography,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { BankEntity } from '../../services/bankService';

interface EntityFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (entity: Omit<BankEntity, 'id' | 'createdAt'>) => Promise<void>;
    initialData?: BankEntity | null;
}

export default function EntityForm({ open, onClose, onSave, initialData }: EntityFormProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [type, setType] = useState<'Person' | 'Organization'>('Person');
    const [name, setName] = useState('');
    const [pan, setPan] = useState('');
    const [regNumber, setRegNumber] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setType(initialData.type);
            setName(initialData.name);
            setPan(initialData.pan || '');
            setRegNumber(initialData.meta?.regNumber || '');
            setContactPerson(initialData.meta?.contactPerson || '');
        } else {
            resetForm();
        }
    }, [initialData, open]);

    const resetForm = () => {
        setType('Person');
        setName('');
        setPan('');
        setRegNumber('');
        setContactPerson('');
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            await onSave({
                type,
                name,
                pan,
                meta: {
                    regNumber,
                    contactPerson
                }
            });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const content = (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={type} label="Type" onChange={(e: any) => setType(e.target.value)}>
                    <MenuItem value="Person">Person (Family Member)</MenuItem>
                    <MenuItem value="Organization">Organization / Trust</MenuItem>
                </Select>
            </FormControl>

            <TextField
                label={type === 'Person' ? "Full Name" : "Organization Name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
            />

            <TextField
                label="PAN Number"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                fullWidth
                placeholder="ABCDE1234F"
            />

            {type === 'Organization' && (
                <>
                    <TextField
                        label="Registration Number / Trust Deed No"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Contact Person Name"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        fullWidth
                    />
                </>
            )}
        </Box>
    );

    if (isMobile) {
        return (
            <Drawer
                anchor="bottom"
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '90vh' }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #eee' }}>
                    <Typography variant="h6">{initialData ? 'Edit Entity' : 'Add New Entity'}</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                {content}
                <Box sx={{ p: 2 }}>
                    <Button variant="contained" fullWidth size="large" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Entity'}
                    </Button>
                </Box>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{initialData ? 'Edit Entity' : 'Add New Entity'}</DialogTitle>
            <DialogContent dividers>{content}</DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
