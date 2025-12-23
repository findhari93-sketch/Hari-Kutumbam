'use client';
import React, { useState, useEffect } from 'react';
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
    Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useRBAC } from '@/hooks/useRBAC';
import { userService } from '@/services/userService';

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

    useEffect(() => {
        if (profile?.photoURL) {
            setAvatarUrl(profile.photoURL);
        }
    }, [profile]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;
        const file = e.target.files[0];
        setUploading(true);
        try {
            const url = await userService.uploadAvatar(user.uid, file);
            setAvatarUrl(url);
            setMsg('Profile picture updated successfully');
        } catch (error) {
            console.error(error);
            setMsg('Failed to upload picture');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Settings
            </Typography>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs value={value} onChange={handleChange} indicatorColor="primary" textColor="primary">
                    <Tab label="Profile" />
                    {/* Other tabs can remain or be conditionally rendered */}
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
                                onChange={handleAvatarUpload}
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
        </Box>
    );
}
