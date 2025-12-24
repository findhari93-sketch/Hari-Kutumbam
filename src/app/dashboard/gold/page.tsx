'use client';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
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
    InputAdornment,
    CircularProgress,
    Tabs,
    Tab,
    useTheme,
    useMediaQuery,
    IconButton,
    Menu,
    ToggleButton,
    ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Switch,
    FormControlLabel,
    Collapse,
    Modal
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'; // For Gift Icon
import CloseIcon from '@mui/icons-material/Close';

import ImageUploadWithCrop from '@/components/common/ImageUploadWithCrop';
import GoldAnalytics from '@/components/common/GoldAnalytics';
import GiftPlanner from '@/components/gold/GiftPlanner';
import { fetchGoldRate, fetchHistoricalRates, GoldRate, HistoricalRate } from '@/services/goldRate';
import { addGoldItem, getGoldItems, updateGoldItem, deleteGoldItem, GoldItem } from '@/services/goldVault';
import { auth } from '@/services/firebase';
import { uploadImage } from '@/services/storage';
import { onAuthStateChanged } from 'firebase/auth';

const OWNERS = ['Mother', 'Wife', 'Self'];
const LOCATIONS = ['Home Safe', 'Bank Locker', 'Shelf A'];
const CITIES = ['Chennai', 'Trichy', 'Madurai', 'Pudukkottai'];

export default function GoldVaultPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // --- State ---
    const [userId, setUserId] = useState<string | null>(null);
    const [rateData, setRateData] = useState<GoldRate | null>(null);
    const [historicalData, setHistoricalData] = useState<HistoricalRate[]>([]);

    // Inventory State
    const [items, setItems] = useState<GoldItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);

    const [selectedCity, setSelectedCity] = useState('Chennai');
    const [selectedKarat, setSelectedKarat] = useState<'24k' | '22k'>('22k');
    const [activeTab, setActiveTab] = useState(0);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

    const [searchTerm, setSearchTerm] = useState('');

    // Dialogs
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingItem, setEditingItem] = useState<GoldItem | null>(null);

    // Preview Image State
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Form State
    const [newItem, setNewItem] = useState<{
        name: string;
        weight: string;
        owner: string;
        location: string;
        image: string;
        imageFile: File | null;
        isGift: boolean;
        gifterName: string;
        gifterContact: string;
    }>({
        name: '',
        weight: '',
        owner: 'Self',
        location: 'Home Safe',
        image: '',
        imageFile: null,
        isGift: false,
        gifterName: '',
        gifterContact: ''
    });

    const [openAudit, setOpenAudit] = useState(false);
    const [selectedAuditItem, setSelectedAuditItem] = useState<GoldItem | null>(null);
    const [saving, setSaving] = useState(false);

    // Auth & Initial Load
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                fetchItems(user.uid);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch Rates
    useEffect(() => {
        const getRate = async () => {
            const data = await fetchGoldRate(selectedCity);
            if (data) setRateData(data);
        };
        const getHistory = async () => {
            const history = await fetchHistoricalRates(selectedCity);
            setHistoricalData(history);
        };
        getRate();
        getHistory();
    }, [selectedCity]);

    const fetchItems = async (uid: string) => {
        setLoadingItems(true);
        try {
            const data = await getGoldItems(uid);
            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingItems(false);
        }
    };

    const currentRate = rateData ? (selectedKarat === '24k' ? rateData.price24k : rateData.price22k) : 0;

    // --- Actions ---

    const handleSaveItem = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            let imageUrl = newItem.image;

            // Upload image if a new file exists
            if (newItem.imageFile) {
                const path = `gold_images/${userId}/${Date.now()}_${newItem.imageFile.name}`;
                imageUrl = await uploadImage(newItem.imageFile, path);
            }

            const itemData = {
                name: newItem.name,
                weight: Number(newItem.weight),
                owner: newItem.owner,
                location: newItem.location,
                image: imageUrl, // Save the actual download URL
                gifterName: newItem.isGift ? newItem.gifterName : undefined,
                gifterContact: newItem.isGift ? newItem.gifterContact : undefined
            };

            if (isEditMode && editingItem) {
                await updateGoldItem(editingItem.id!, itemData, editingItem);
            } else {
                await addGoldItem(userId, itemData);
            }
            setOpenDialog(false);
            fetchItems(userId);
            resetForm();
        } catch (e) {
            console.error(e);
            alert("Error saving item. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await deleteGoldItem(id);
            fetchItems(userId!);
        } catch (e) { alert("Error deleting"); }
    };

    const openEdit = (item: GoldItem) => {
        setEditingItem(item);
        setNewItem({
            name: item.name,
            weight: item.weight.toString(),
            owner: item.owner,
            location: item.location,
            image: item.image,
            imageFile: null,
            isGift: !!item.gifterName,
            gifterName: item.gifterName || '',
            gifterContact: item.gifterContact || ''
        });
        setIsEditMode(true);
        setOpenDialog(true);
    };

    const openAuditLog = (item: GoldItem) => {
        setSelectedAuditItem(item);
        setOpenAudit(true);
    };

    const resetForm = () => {
        setNewItem({
            name: '',
            weight: '',
            owner: 'Self',
            location: 'Home Safe',
            image: '',
            imageFile: null,
            isGift: false,
            gifterName: '',
            gifterContact: ''
        });
        setIsEditMode(false);
        setEditingItem(null);
    };

    // Stats
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const totalValue = totalWeight * currentRate;

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2, pb: 10 }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'start', md: 'center' },
                mb: 3,
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(45deg, #FFD700 30%, #FF8C00 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Gold Wealth Vault
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Retail Price (incl. GST & Duty) • {selectedCity}
                    </Typography>
                </Box>
                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                            {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label="22K" color={selectedKarat === '22k' ? 'primary' : 'default'} onClick={() => setSelectedKarat('22k')} />
                        <Chip label="24K" color={selectedKarat === '24k' ? 'primary' : 'default'} onClick={() => setSelectedKarat('24k')} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="primary">₹{currentRate.toLocaleString()}</Typography>
                </Box>
            </Box>

            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ mb: 3 }}
                variant="scrollable"
                scrollButtons="auto"
            >
                <Tab label="My Vault" />
                <Tab label="Market Analytics" />
                <Tab label="Gift Planner" />
            </Tabs>

            {/* Tab 0: Vault Inventory */}
            {activeTab === 0 && (
                <Box>
                    {/* Stats */}
                    <Card sx={{ bgcolor: 'secondary.main', color: 'white', mb: 3 }}>
                        <CardContent>
                            <Typography variant="h3" fontWeight="bold">₹ {totalValue.toLocaleString()}</Typography>
                            <Typography>Total Weight: {totalWeight}g</Typography>
                        </CardContent>
                    </Card>

                    {/* Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <TextField
                            size="small"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={(_, v) => v && setViewMode(v)}
                                size="small"
                            >
                                <ToggleButton value="card"><GridViewIcon /></ToggleButton>
                                <ToggleButton value="table"><ViewListIcon /></ToggleButton>
                            </ToggleButtonGroup>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForm(); setOpenDialog(true); }}>
                                Add
                            </Button>
                        </Box>
                    </Box>

                    {loadingItems ? <CircularProgress /> : viewMode === 'card' ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 3 }}>
                            {filteredItems.map(item => (
                                <Card key={item.id}>
                                    <Box sx={{ position: 'relative', aspectRatio: '4/3', cursor: 'pointer' }} onClick={() => item.image && setPreviewImage(item.image)}>
                                        <img src={item.image || 'https://placehold.co/150'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <Box
                                            onClick={(e) => e.stopPropagation()} // Prevent preview when clicking menu
                                            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: '50%' }}
                                        >
                                            <ItemMenu item={item} onEdit={openEdit} onDelete={handleDelete} onAudit={openAuditLog} />
                                        </Box>

                                        {item.gifterName && (
                                            <Chip
                                                icon={<CardGiftcardIcon fontSize="small" />}
                                                label="Gift"
                                                color="secondary"
                                                size="small"
                                                sx={{ position: 'absolute', bottom: 8, left: 8 }}
                                            />
                                        )}
                                    </Box>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Typography variant="h6" noWrap>{item.name}</Typography>
                                        </Box>
                                        <Typography variant="body2">{item.location} • {item.owner}</Typography>

                                        {item.gifterName && (
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                Gifted by: {item.gifterName}
                                            </Typography>
                                        )}

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, alignItems: 'center' }}>
                                            <Chip label={`${item.weight}g`} size="small" />
                                            <Typography fontWeight="bold" color="success.main">₹{(item.weight * currentRate).toLocaleString()}</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Image</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Weight</TableCell>
                                        <TableCell>Value</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Owner</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <img
                                                    src={item.image || 'https://placehold.co/150'}
                                                    style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', cursor: 'pointer' }}
                                                    onClick={() => item.image && setPreviewImage(item.image)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {item.name}
                                                {item.gifterName && <Chip size="small" label="Gift" color="secondary" sx={{ ml: 1, height: 20 }} />}
                                            </TableCell>
                                            <TableCell>{item.weight}g</TableCell>
                                            <TableCell>₹{(item.weight * currentRate).toLocaleString()}</TableCell>
                                            <TableCell>{item.location}</TableCell>
                                            <TableCell>{item.owner}</TableCell>
                                            <TableCell>
                                                <ItemMenu item={item} onEdit={openEdit} onDelete={handleDelete} onAudit={openAuditLog} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}

            {/* Tab 1: Analytics Tab */}
            {activeTab === 1 && (
                <GoldAnalytics
                    history={historicalData}
                    loading={false}
                    currentPrice={rateData?.price22k || 0}
                    city={selectedCity}
                    onCityChange={setSelectedCity}
                />
            )}

            {/* Tab 2: Gift Planner */}
            {activeTab === 2 && (
                <GiftPlanner />
            )}

            {/* Full Screen Image Preview Modal */}
            <Modal
                open={!!previewImage}
                onClose={() => setPreviewImage(null)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
            >
                <Box sx={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', outline: 'none' }}>
                    <IconButton
                        onClick={() => setPreviewImage(null)}
                        sx={{ position: 'absolute', top: -40, right: 0, color: 'white' }}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                    {previewImage && (
                        <img
                            src={previewImage}
                            style={{ maxWidth: '100vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                        />
                    )}
                </Box>
            </Modal>

            {/* Edit/Add Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>{isEditMode ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ mb: 2 }}>
                        {!newItem.image ? (
                            <ImageUploadWithCrop onImageUpload={(file) => setNewItem({ ...newItem, image: URL.createObjectURL(file), imageFile: file })} aspectRatio={4 / 3} />
                        ) : (
                            <Box sx={{ position: 'relative', height: 200 }}>
                                <img src={newItem.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                                <Button size="small" variant="contained" color="error"
                                    sx={{ position: 'absolute', top: 8, right: 8 }}
                                    onClick={() => setNewItem({ ...newItem, image: '', imageFile: null })}>Change</Button>
                            </Box>
                        )}
                    </Box>
                    <TextField label="Name" fullWidth value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} sx={{ mb: 2 }} />
                    <TextField label="Weight (g)" type="number" fullWidth value={newItem.weight} onChange={e => setNewItem({ ...newItem, weight: e.target.value })} sx={{ mb: 2 }} />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Owner</InputLabel>
                        <Select value={newItem.owner} label="Owner" onChange={e => setNewItem({ ...newItem, owner: e.target.value })}>
                            {OWNERS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Location</InputLabel>
                        <Select value={newItem.location} label="Location" onChange={e => setNewItem({ ...newItem, location: e.target.value })}>
                            {LOCATIONS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                        </Select>
                    </FormControl>

                    {/* Gift Section */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={newItem.isGift}
                                onChange={(e) => setNewItem({ ...newItem, isGift: e.target.checked })}
                            />
                        }
                        label="Received as Gift?"
                        sx={{ mb: 1 }}
                    />

                    <Collapse in={newItem.isGift}>
                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>Gifter Details</Typography>
                            <TextField
                                label="Gifter Name"
                                fullWidth
                                size="small"
                                value={newItem.gifterName}
                                onChange={e => setNewItem({ ...newItem, gifterName: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="Gifter Phone (Optional)"
                                fullWidth
                                size="small"
                                value={newItem.gifterContact}
                                onChange={e => setNewItem({ ...newItem, gifterContact: e.target.value })}
                            />
                        </Box>
                    </Collapse>

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveItem} disabled={saving}>
                        {saving ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Audit Dialog */}
            <Dialog open={openAudit} onClose={() => setOpenAudit(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Audit History: {selectedAuditItem?.name}</DialogTitle>
                <DialogContent>
                    <Timeline position="alternate">
                        {selectedAuditItem?.auditLog?.slice().reverse().map((log, i) => (
                            <TimelineItem key={i}>
                                <TimelineOppositeContent color="text.secondary">
                                    {new Date(log.timestamp).toLocaleDateString()}
                                    <br />
                                    <Typography variant="caption">{new Date(log.timestamp).toLocaleTimeString()}</Typography>
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineDot color={log.action === 'Created' ? 'success' : log.action === 'Updated' ? 'info' : 'warning'} />
                                    <TimelineConnector />
                                </TimelineSeparator>
                                <TimelineContent>
                                    <Typography fontWeight="bold">{log.action}</Typography>
                                    <Typography variant="body2">{log.details}</Typography>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAudit(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function ItemMenu({ item, onEdit, onDelete, onAudit }: any) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    return (
        <>
            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { onEdit(item); setAnchorEl(null); }}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                </MenuItem>
                <MenuItem onClick={() => { onAudit(item); setAnchorEl(null); }}>
                    <HistoryIcon fontSize="small" sx={{ mr: 1 }} /> Audit History
                </MenuItem>
                <MenuItem onClick={() => { onDelete(item.id); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                </MenuItem>
            </Menu>
        </>
    );
}
