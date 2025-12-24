'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Tab, Tabs, Paper } from '@mui/material';
import { useRBAC } from '@/hooks/useRBAC';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types';
import CategoryImport from '@/components/categories/CategoryImport';
import CategoryFlowView from '@/components/categories/CategoryFlowView';
import CategoryListView from '@/components/categories/CategoryListView';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function CategoriesPage() {
    const { user } = useRBAC();
    const [value, setValue] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        if (user) {
            loadCategories();
        }
    }, [user, refreshTrigger]);

    const loadCategories = async () => {
        if (!user) return;
        try {
            const data = await categoryService.getUserCategories(user.uid);
            setCategories(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Category Management
            </Typography>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs value={value} onChange={handleChange} indicatorColor="primary" textColor="primary">
                    <Tab label="List View" />
                    <Tab label="Visual View" />
                    <Tab label="Bulk Import" />
                </Tabs>
            </Paper>

            <TabPanel value={value} index={0}>
                {user && (
                    <CategoryListView
                        categories={categories}
                        userId={user.uid}
                        onUpdate={handleRefresh}
                    />
                )}
            </TabPanel>

            <TabPanel value={value} index={1}>
                <CategoryFlowView categories={categories} />
            </TabPanel>

            <TabPanel value={value} index={2}>
                {user && (
                    <CategoryImport
                        onImportComplete={() => {
                            handleRefresh();
                            setValue(0); // Switch to list view to see results
                        }}
                        userId={user.uid}
                    />
                )}
            </TabPanel>
        </Box>
    );
}
