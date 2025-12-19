'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardMedia,
    Button,
    Chip,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

const OWNERS = ['Mother', 'Wife', 'Self'];
const LOCATIONS = ['Home Safe', 'Bank Locker', 'Shelf A'];

export default function GoldVaultPage() {
    const [ratePerGram, setRatePerGram] = useState(6250); // Live rate mock
    const [items, setItems] = useState([
        { id: 1, name: 'Gold Necklace', weight: 45, owner: 'Mother', location: 'Bank Locker', image: 'https://placehold.co/150' },
        { id: 2, name: 'Wedding Ring', weight: 8, owner: 'Wife', location: 'Home Safe', image: 'https://placehold.co/150' },
        { id: 3, name: 'Gold Coin', weight: 10, owner: 'Self', location: 'Home Safe', image: 'https://placehold.co/150' },
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [openAdd, setOpenAdd] = useState(false);

    // Stats
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const totalValue = totalWeight * ratePerGram;

    const motherWeight = items.filter(i => i.owner === 'Mother').reduce((sum, i) => sum + i.weight, 0);
    const familyWeight = items.filter(i => i.owner !== 'Mother').reduce((sum, i) => sum + i.weight, 0);

    // New Item State
    const [newItem, setNewItem] = useState({ name: '', weight: '', owner: 'Self', location: 'Home Safe' });

    const handleAddItem = () => {
        setItems([...items, {
            id: Date.now(),
            name: newItem.name,
            weight: Number(newItem.weight),
            owner: newItem.owner,
            location: newItem.location,
            image: 'https://placehold.co/150'
        }]);
        setOpenAdd(false);
        setNewItem({ name: '', weight: '', owner: 'Self', location: 'Home Safe' });
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Gold Wealth Vault
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        size="small"
                        label="Today's Rate (₹/g)"
                        type="number"
                        value={ratePerGram}
                        onChange={(e) => setRatePerGram(Number(e.target.value))}
                        sx={{ width: 150 }}
                    />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
                        Add Jewel
                    </Button>
                </Box>
            </Box>

            {/* Stats Cards */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
                <Box sx={{ flex: 1 }}>
                    <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                        <CardContent>
                            <Typography gutterBottom>Total Family Wealth</Typography>
                            <Typography variant="h3" fontWeight="bold">₹ {totalValue.toLocaleString()}</Typography>
                            <Typography variant="subtitle2">Total Weight: {totalWeight}g</Typography>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Mother's Share</Typography>
                            <Typography variant="h4" fontWeight="bold" color="secondary.main">₹ {(motherWeight * ratePerGram).toLocaleString()}</Typography>
                            <Typography variant="body2">{motherWeight}g</Typography>
                        </CardContent>
                    </Card>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>My Family (Self+Wife)</Typography>
                            <Typography variant="h4" fontWeight="bold" color="primary.main">₹ {(familyWeight * ratePerGram).toLocaleString()}</Typography>
                            <Typography variant="body2">{familyWeight}g</Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Search & Inventory */}
            <TextField
                fullWidth
                placeholder="Search by name or location (e.g., 'Ring', 'Locker')..."
                InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
                {filteredItems.map((item) => (
                    <Box key={item.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardMedia
                                component="img"
                                height="140"
                                image={item.image}
                                alt={item.name}
                                sx={{ bgcolor: 'grey.200' }}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" fontWeight="bold">{item.name}</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                    <Chip label={`${item.weight}g`} size="small" color="secondary" />
                                    <Chip label={item.owner} size="small" variant="outlined" />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    Location: <b>{item.location}</b>
                                </Typography>
                                <Typography variant="body2" color="success.main" fontWeight="medium" sx={{ mt: 1 }}>
                                    Value: ₹{(item.weight * ratePerGram).toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                ))}
            </Box>

            {/* Add Dialog */}
            <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
                <DialogTitle>Add New Gold Item</DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 300 }}>
                    <TextField
                        label="Item Name"
                        fullWidth
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        label="Weight (grams)"
                        type="number"
                        fullWidth
                        value={newItem.weight}
                        onChange={(e) => setNewItem({ ...newItem, weight: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Owner</InputLabel>
                        <Select
                            value={newItem.owner}
                            label="Owner"
                            onChange={(e) => setNewItem({ ...newItem, owner: e.target.value })}
                        >
                            {OWNERS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Location</InputLabel>
                        <Select
                            value={newItem.location}
                            label="Location"
                            onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                        >
                            {LOCATIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
                        Upload Photo
                        <input hidden accept="image/*" type="file" />
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
                    <Button onClick={handleAddItem} variant="contained">Save Item</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
