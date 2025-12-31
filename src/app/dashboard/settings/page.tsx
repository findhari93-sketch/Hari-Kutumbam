'use client';
import React, { useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/utils/cropImage';
import imageCompression from 'browser-image-compression';
import {
    Box,
    Typography,
    Tab,
    Tabs,
    Paper,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    Avatar,
    Chip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useRBAC } from '@/hooks/useRBAC';
import { userService } from '@/services/userService';
import { expenseService } from '@/services/expenseService';

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function SettingsPage() {
    const { user, profile, role } = useRBAC();
    const [value, setValue] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(profile?.photoURL);
    const [msg, setMsg] = useState('');
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

    // Crop state
    const [openCrop, setOpenCrop] = useState(false);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    useEffect(() => {
        if (profile?.photoURL) {
            setAvatarUrl(profile.photoURL);
        }
    }, [profile]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        // Convert to base64 for preview/cropping
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setSelectedImg(reader.result?.toString() || null);
            setOpenCrop(true);
        });
        reader.readAsDataURL(file);

        // Reset input value so same file can be selected again
        e.target.value = '';
    };

    const handleClearAll = async () => {
        if (!user) return;
        try {
            await expenseService.deleteAllExpenses(user);
            setMsg('All expenses cleared successfully.');
            setClearConfirmOpen(false);
        } catch (error) {
            console.error(error);
            setMsg('Failed to clear data.');
        }
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const saveCroppedImage = async () => {
        if (!selectedImg || !croppedAreaPixels || !user) return;

        try {
            setUploading(true);
            // Dialog remains open while uploading

            // 1. Get cropped blob
            const croppedBlob = await getCroppedImg(selectedImg, croppedAreaPixels);
            if (!croppedBlob) throw new Error('Failed to crop image');

            // 2. Compress
            const compressionOptions = {
                maxSizeMB: 0.2, // 200KB
                maxWidthOrHeight: 500,
                useWebWorker: true,
                fileType: 'image/jpeg'
            };

            // browser-image-compression takes File or Blob. 
            // We need to convert Blob to File for it to be happy with name/type usually, 
            // but it accepts Blob too. Let's cast to File for better compatibility if needed.
            const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });

            const compressedFile = await imageCompression(croppedFile, compressionOptions);

            // 3. Upload
            const url = await userService.uploadAvatar(user.uid, compressedFile);
            setAvatarUrl(url);
            setMsg('Profile picture updated successfully');
        } catch (error) {
            console.error(error);
            setMsg('Failed to upload picture');
        } finally {
            setUploading(false);
            setOpenCrop(false); setSelectedImg(null);
        }
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Settings
            </Typography>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs value={value} onChange={handleChange} indicatorColor="primary" textColor="primary">
                    <Tab label="Profile" />
                    <Tab label="Data Management" />
                </Tabs>
            </Paper>

            <TabPanel value={value} index={0}>
                <Card sx={{ maxWidth: 600 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                            <Avatar
                                src={avatarUrl || user?.photoURL || ''}
                                sx={{ width: 100, height: 100 }}
                            />
                            <Box>
                                <Typography variant="h6">{profile?.displayName || user?.displayName}</Typography>
                                <Typography color="text.secondary">{profile?.email}</Typography>
                                <Chip label={`Role: ${role?.toUpperCase() || 'USER'}`} color="primary" size="small" sx={{ mt: 1 }} />
                            </Box>
                        </Box>

                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            disabled={uploading}
                        >
                            Upload Profile Picture
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                        </Button>
                        {msg && <Alert severity="info" sx={{ mt: 2 }}>{msg}</Alert>}

                        <Box sx={{ mt: 4 }}>
                            <Typography variant="subtitle1" gutterBottom>Role Information</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {role === 'admin' && "You are an Admin. You have full access to all expenses and settings."}
                                {role === 'family' && "You are a Family Member. You can view expenses and manage your logs."}
                                {role === 'office' && "You are an Office user. You have limited access to sensitive data."}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </TabPanel>

            <TabPanel value={value} index={1}>
                <Card sx={{ maxWidth: 600, borderColor: 'error.main' }} variant="outlined">
                    <CardContent>
                        <Typography variant="h6" color="error" gutterBottom>Danger Zone</Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Once you delete your data, there is no going back. Please be certain.
                        </Typography>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setClearConfirmOpen(true)}
                        >
                            Clear All Data (Start Fresh)
                        </Button>
                    </CardContent>
                </Card>
            </TabPanel>

            {/* Clear Data Confirmation */}
            <Dialog open={clearConfirmOpen} onClose={() => setClearConfirmOpen(false)}>
                <DialogTitle>Clear All Data?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete ALL expenses? This action cannot be undone.
                        This is useful for starting fresh (e.g. New Year).
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClearConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleClearAll} color="error" variant="contained">Yes, Clear All</Button>
                </DialogActions>
            </Dialog>

            {/* Crop Dialog */}
            <Dialog open={openCrop} onClose={() => { if (!uploading) { setOpenCrop(false); setSelectedImg(null); } }} maxWidth="sm" fullWidth>
                <DialogTitle>Adjust Image</DialogTitle>
                <DialogContent>
                    <Box sx={{ position: 'relative', width: '100%', height: 300, bgcolor: '#333' }}>
                        {selectedImg && (
                            <Cropper
                                image={selectedImg}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // Square aspect ratio for avatar
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </Box>
                    <Box sx={{ p: 2 }}>
                        <Typography gutterBottom>Zoom</Typography>
                        <Slider
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(_, zoom) => setZoom(Number(zoom))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setOpenCrop(false); setSelectedImg(null); }} disabled={uploading}>Cancel</Button>
                    <Button onClick={saveCroppedImage} variant="contained" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Picture'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
