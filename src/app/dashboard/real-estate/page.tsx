'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Button,
    Card,
    CardContent,
    CardActions,
    Chip,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptIcon from '@mui/icons-material/Receipt';

export default function RealEstatePage() {
    const [tabIndex, setTabIndex] = useState(0);
    const [properties, setProperties] = useState([
        { id: 1, name: 'Plot at OMR', type: 'Land', boughtAt: 2500000, currentValue: 4500000, docs: 3 },
        { id: 2, name: 'Ancestral House', type: 'House', boughtAt: 1000000, currentValue: 6000000, docs: 5 },
    ]);
    const [openAdd, setOpenAdd] = useState(false);
    const [newProp, setNewProp] = useState({ name: '', type: '', boughtAt: '' });

    const handleAdd = () => {
        setProperties([...properties, {
            id: Date.now(),
            name: newProp.name,
            type: newProp.type || 'Land',
            boughtAt: Number(newProp.boughtAt),
            currentValue: Number(newProp.boughtAt), // Default to purchase price
            docs: 0
        }]);
        setOpenAdd(false);
        setNewProp({ name: '', type: '', boughtAt: '' });
    };

    const totalInvestment = properties.reduce((sum, p) => sum + p.boughtAt, 0);
    const totalValue = properties.reduce((sum, p) => sum + p.currentValue, 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Real Estate Portfolio
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
                    Add Property
                </Button>
            </Box>

            {/* ROI Card */}
            <Card sx={{ mb: 4, background: 'linear-gradient(to right, #0f172a, #334155)', color: 'white' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>Total Invested</Typography>
                            <Typography variant="h5" fontWeight="bold">₹ {(totalInvestment / 100000).toFixed(1)} Lakhs</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>Current Valuation</Typography>
                            <Typography variant="h5" fontWeight="bold" color="success.light">₹ {(totalValue / 100000).toFixed(1)} Lakhs</Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>Appreciation</Typography>
                            <Typography variant="h5" fontWeight="bold" color="success.light">
                                + {(((totalValue - totalInvestment) / totalInvestment) * 100).toFixed(1)}%
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3 }}>
                <Tab label="My Properties" />
                <Tab label="Documents & Bills" />
            </Tabs>

            {tabIndex === 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    {properties.map((prop) => (
                        <Box key={prop.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">{prop.name}</Typography>
                                            <Chip label={prop.type} size="small" sx={{ mt: 0.5 }} />
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" display="block" color="text.secondary">Current Value</Typography>
                                            <Typography variant="h6" fontWeight="bold">₹ {prop.currentValue.toLocaleString()}</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Bought for: ₹ {prop.boughtAt.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {prop.docs} Documents stored
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button size="small" startIcon={<DescriptionIcon />}>View Docs</Button>
                                    <Button size="small" startIcon={<ReceiptIcon />}>Add Bill</Button>
                                </CardActions>
                            </Card>
                        </Box>
                    ))}
                </Box>
            )}

            {tabIndex === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Uploaded Documents</Typography>
                        <List>
                            {[1, 2, 3].map((i) => (
                                <ListItem key={i} divider disablePadding>
                                    <ListItemButton>
                                        <ListItemIcon><DescriptionIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary={`Property_Deed_Scan_00${i}.pdf`}
                                            secondary="Uploaded on 12 Dec 2023 • 2.4 MB"
                                        />
                                    </ListItemButton>
                                    <Button variant="outlined" size="small" sx={{ mr: 2 }}>View</Button>
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
                <DialogTitle>Add New Property</DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 300 }}>
                    <TextField
                        label="Property Name"
                        fullWidth
                        value={newProp.name}
                        onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        label="Property Type (Land/House)"
                        fullWidth
                        value={newProp.type}
                        onChange={(e) => setNewProp({ ...newProp, type: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Purchase Price (₹)"
                        type="number"
                        fullWidth
                        value={newProp.boughtAt}
                        onChange={(e) => setNewProp({ ...newProp, boughtAt: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
                    <Button onClick={handleAdd} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
