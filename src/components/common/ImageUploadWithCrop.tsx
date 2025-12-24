import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Slider,
    Typography,
    IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import imageCompression from 'browser-image-compression';

interface ImageUploadWithCropProps {
    onImageUpload: (file: File) => void;
    aspectRatio?: number; // e.g., 4 / 3
}

export default function ImageUploadWithCrop({ onImageUpload, aspectRatio = 4 / 3 }: ImageUploadWithCropProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [fileName, setFileName] = useState('');

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFileName(file.name);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string);
                setIsCropModalOpen(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area,
        rotation = 0
    ): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return null;
        }

        const rotRad = (rotation * Math.PI) / 180;

        // calculate bounding box of the rotated image
        const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
            image.width,
            image.height,
            rotation
        );

        // set canvas size to match the bounding box
        canvas.width = bBoxWidth;
        canvas.height = bBoxHeight;

        // translate canvas context to a central location to allow rotating and flipping around the center
        ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
        ctx.rotate(rotRad);
        ctx.translate(-image.width / 2, -image.height / 2);

        // draw rotated image
        ctx.drawImage(image, 0, 0);

        const data = ctx.getImageData(
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height
        );

        // set canvas width to final desired crop size - this will clear existing context
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // paste generated rotate image at the top left corner
        ctx.putImageData(data, 0, 0);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    const rotateSize = (width: number, height: number, rotation: number) => {
        const rotRad = (rotation * Math.PI) / 180;
        return {
            width:
                Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
            height:
                Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
        };
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            if (croppedBlob) {
                // Compress the image
                const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
                const options = {
                    maxSizeMB: 0.5, // Compress to ~500KB
                    maxWidthOrHeight: 1200,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, options);
                onImageUpload(compressedFile);
                setIsCropModalOpen(false);
                // Reset state
                setImageSrc(null);
                setZoom(1);
                setRotation(0);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{
                        height: 100,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}
                >
                    Upload
                    <Typography variant="caption" color="text.secondary">
                        From Gallery
                    </Typography>
                    <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={onFileChange}
                    />
                </Button>

                <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<PhotoCamera />}
                    sx={{
                        height: 100,
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}
                >
                    Camera
                    <Typography variant="caption" color="text.secondary">
                        Take Photo
                    </Typography>
                    <input
                        type="file"
                        hidden
                        accept="image/*"
                        capture="environment"
                        onChange={onFileChange}
                    />
                </Button>
            </Box>

            <Dialog
                open={isCropModalOpen}
                onClose={() => setIsCropModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Edit Photo</DialogTitle>
                <DialogContent>
                    <Box sx={{ position: 'relative', width: '100%', height: 400, bgcolor: '#333', mb: 2 }}>
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onCropComplete={handleCropComplete}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                            />
                        )}
                    </Box>

                    <Box sx={{ px: 2 }}>
                        <Typography variant="caption">Zoom</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ZoomOutIcon color="action" />
                            <Slider
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                onChange={(e, zoom) => setZoom(Number(zoom))}
                            />
                            <ZoomInIcon color="action" />
                        </Box>

                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Rotation</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton onClick={() => setRotation((r) => r - 90)} size="small">
                                <RotateLeftIcon />
                            </IconButton>
                            <Slider
                                value={rotation}
                                min={0}
                                max={360}
                                step={1}
                                onChange={(e, rotation) => setRotation(Number(rotation))}
                            />
                            <IconButton onClick={() => setRotation((r) => r + 90)} size="small">
                                <RotateRightIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsCropModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Crop & Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
