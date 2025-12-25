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
    IconButton,
    InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { BankAccount } from '../../services/bankService';
import ImageUploadWithCrop from '../common/ImageUploadWithCrop';
import { encryptSensitive, decryptSensitive } from '../../utils/encryptionUtils';

interface AccountFormProps {
    open: boolean;
    onClose: () => void;
    onSave: (account: Omit<BankAccount, 'id' | 'createdAt'>, file?: File) => Promise<void>;
    initialData?: BankAccount | null;
    entityId: string;
}

const POPULAR_BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Indian Bank', 'Canara Bank', 'Union Bank'];

export default function AccountForm({ open, onClose, onSave, initialData, entityId }: AccountFormProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [branchName, setBranchName] = useState('');
    const [netbankingUser, setNetbankingUser] = useState('');
    const [netbankingPass, setNetbankingPass] = useState('');
    const [profilePass, setProfilePass] = useState('');
    const [type, setType] = useState<'Savings' | 'Current' | 'Credit'>('Savings');
    const [balance, setBalance] = useState('');
    const [passbookFile, setPassbookFile] = useState<File | null>(null);
    const [passbookPreview, setPassbookPreview] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setBankName(initialData.bankName);
            setAccountNumber(initialData.accountNumber);
            setIfsc(initialData.ifsc);
            setBranchName(initialData.branchName || '');
            setNetbankingUser(initialData.netbankingUser || '');
            setNetbankingPass(initialData.netbankingPasswordEncrypted ? decryptSensitive(initialData.netbankingPasswordEncrypted) : '');
            setProfilePass(initialData.profilePasswordEncrypted ? decryptSensitive(initialData.profilePasswordEncrypted) : '');
            setType(initialData.type);
            setBalance(initialData.balance.toString());
            setPassbookPreview(initialData.images?.passbook || '');
        } else {
            resetForm();
        }
    }, [initialData, open]);

    const resetForm = () => {
        setBankName('');
        setAccountNumber('');
        setIfsc('');
        setBranchName('');
        setNetbankingUser('');
        setNetbankingPass('');
        setProfilePass('');
        setType('Savings');
        setBalance('');
        setPassbookFile(null);
        setPassbookPreview('');
    };

    const handleSubmit = async () => {
        if (!bankName || !accountNumber) return;
        setSaving(true);
        try {
            await onSave({
                entityId, // Associated with parent entity
                bankName,
                accountNumber,
                ifsc: ifsc.toUpperCase(),
                branchName,
                netbankingUser,
                netbankingPasswordEncrypted: encryptSensitive(netbankingPass),
                profilePasswordEncrypted: encryptSensitive(profilePass),
                type,
                balance: Number(balance) || 0,
                images: { passbook: passbookPreview } // If existing
            }, passbookFile || undefined);
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
                <InputLabel>Bank Name</InputLabel>
                <Select
                    value={POPULAR_BANKS.includes(bankName) ? bankName : 'Other'}
                    label="Bank Name"
                    onChange={(e) => {
                        if (e.target.value === 'Other') setBankName('');
                        else setBankName(e.target.value);
                    }}
                >
                    {POPULAR_BANKS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                    <MenuItem value="Other">Other Bank...</MenuItem>
                </Select>
            </FormControl>

            {(!POPULAR_BANKS.includes(bankName) || bankName === '') && (
                <TextField
                    label="Enter Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    fullWidth
                    required
                />
            )}

            <TextField
                label="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                fullWidth
                required
                type="number"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    label="IFSC Code"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    fullWidth
                    placeholder="SBIN0001234"
                />
                <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select value={type} label="Type" onChange={(e: any) => setType(e.target.value)}>
                        <MenuItem value="Savings">Savings</MenuItem>
                        <MenuItem value="Current">Current</MenuItem>
                        <MenuItem value="Credit">Credit Card</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <TextField
                label="Branch Name (Optional)"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                fullWidth
            />

            <TextField
                label="Current Balance"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                fullWidth
                type="number"
                InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
            />

            <Box sx={{ p: 2, border: '1px dashed #ddd', borderRadius: 2, bgcolor: '#f9f9f9' }}>
                <Typography variant="subtitle2" gutterBottom>Net Banking Credentials (Secure)</Typography>
                <TextField
                    label="User ID"
                    value={netbankingUser}
                    onChange={(e) => setNetbankingUser(e.target.value)}
                    fullWidth
                    margin="dense"
                    size="small"
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Login Password"
                        value={netbankingPass}
                        onChange={(e) => setNetbankingPass(e.target.value)}
                        fullWidth
                        margin="dense"
                        type="password"
                        size="small"
                    />
                    <TextField
                        label="Profile Password"
                        value={profilePass}
                        onChange={(e) => setProfilePass(e.target.value)}
                        fullWidth
                        margin="dense"
                        type="password"
                        size="small"
                    />
                </Box>
            </Box>

            <Box>
                <Typography variant="caption" color="text.secondary">Passbook / Statement Photo</Typography>
                <Box sx={{ mt: 1, border: '1px dashed #ccc', borderRadius: 2, p: 2, textAlign: 'center' }}>
                    {!passbookPreview ? (
                        <Button
                            component="label"
                            startIcon={<UploadFileIcon />}
                        >
                            Upload Photo
                            <input type="file" hidden accept="image/*" onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setPassbookFile(e.target.files[0]);
                                    setPassbookPreview(URL.createObjectURL(e.target.files[0]));
                                }
                            }} />
                        </Button>
                    ) : (
                        <Box sx={{ position: 'relative', height: 150 }}>
                            <img src={passbookPreview} style={{ height: '100%', borderRadius: 8 }} />
                            <IconButton
                                sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                                onClick={() => { setPassbookPreview(''); setPassbookFile(null); }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </Box>
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
                    <Typography variant="h6">{initialData ? 'Edit Account' : 'Add Bank Account'}</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                {content}
                <Box sx={{ p: 2 }}>
                    <Button variant="contained" fullWidth size="large" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Account'}
                    </Button>
                </Box>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{initialData ? 'Edit Account' : 'Add Bank Account'}</DialogTitle>
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
