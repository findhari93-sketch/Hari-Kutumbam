import { useState, useEffect } from 'react';
import {
    getMilkLogs,
    getMilkPayments,
    addMilkLog as addLogService,
    addMilkPayment as addPaymentService,
    updateMilkLog as updateLogService,
    deleteMilkLog as deleteLogService,
    MilkLog,
    MilkPayment
} from '@/services/firestore';
import { useAuth } from '@/context/AuthContext';
import { expenseService } from '@/services/expenseService';

export const useMilkData = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<MilkLog[]>([]);
    const [payments, setPayments] = useState<MilkPayment[]>([]);
    const [loading, setLoading] = useState(true);

    // Stats
    const [pendingAmount, setPendingAmount] = useState(0);
    const [litersThisMonth, setLitersThisMonth] = useState(0);
    const [skippedDays, setSkippedDays] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [fetchedLogs, fetchedPayments] = await Promise.all([
                getMilkLogs(user.uid),
                getMilkPayments(user.uid)
            ]);

            setLogs(fetchedLogs);
            setPayments(fetchedPayments);
            calculateStats(fetchedLogs, fetchedPayments);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (currentLogs: MilkLog[], currentPayments: MilkPayment[]) => {
        // 1. Calculate Total Cost
        const totalCost = currentLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

        // 2. Calculate Total Paid
        const paid = currentPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
        setTotalPaid(paid);

        // 3. Pending
        setPendingAmount(totalCost - paid);

        // 4. Monthly Stats (Current Month)
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const thisMonthLogs = currentLogs.filter(log => log.date.startsWith(currentMonthStr));
        setLitersThisMonth(thisMonthLogs.reduce((sum, log) => sum + (log.quantity || 0), 0));
        setSkippedDays(thisMonthLogs.filter(log => log.status === 'skipped').length);
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const validateDate = (dateStr: string) => {
        const selected = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today

        // Create a comparison date for selected (treat input as start of day)
        const compareDate = new Date(selected);
        compareDate.setHours(0, 0, 0, 0);

        if (compareDate > today) {
            throw new Error("Cannot add/update records for future dates.");
        }
    };

    const addLog = async (date: string, quantity: number, price: number, boiled: boolean) => {
        if (!user) return;
        try {
            validateDate(date);
            const status = quantity > 0 ? 'bought' : 'skipped';
            const cost = quantity * price;

            await addLogService(user.uid, {
                date,
                quantity,
                pricePerLiter: price,
                cost,
                boiled,
                status,
                vendorName: 'Default',
                recordedBy: user.displayName || user.email?.split('@')[0] || 'Unknown'
            });
            await fetchData(); // Refresh
        } catch (error: any) {
            console.error(error);
            alert(error.message); // Basic error handling
        }
    };

    const updateLog = async (id: string, date: string, quantity: number, price: number) => {
        if (!user) return;
        try {
            validateDate(date);
            const status = quantity > 0 ? 'bought' : 'skipped';
            const cost = quantity * price;

            await updateLogService(id, {
                date,
                quantity,
                pricePerLiter: price,
                cost,
                status
            });
            await fetchData();
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        }
    };

    const deleteLog = async (id: string) => {
        if (!user) return;
        try {
            await deleteLogService(id);
            await fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const addPayment = async (amount: number, note?: string, date?: string) => {
        if (!user) return;
        const paymentDate = date || new Date().toISOString().split('T')[0];

        // 1. Record in Milk Tracker
        await addPaymentService(user.uid, {
            date: paymentDate,
            amount,
            note,
            recordedBy: user.displayName || user.email?.split('@')[0] || 'Unknown'
        });

        // 2. Auto-create Expense
        try {
            await expenseService.addExpense({
                amount,
                category: 'Milk',
                subcategory: 'Settlement',
                date: new Date(paymentDate),
                description: `Milk Settlement${note ? ` - ${note}` : ''}`,
                source: 'My Money',
                paymentMode: 'Cash',
                senderName: user.displayName || '',
                receiverName: 'Milk Vendor'
            }, user);
        } catch (error) {
            console.error("Failed to auto-create expense for milk settlement", error);
            // We don't block the UI if this fails, but logging it is good.
        }

        await fetchData();
    };

    return {
        logs,
        payments,
        loading,
        stats: {
            pendingAmount,
            litersThisMonth,
            skippedDays,
            totalPaid
        },
        addLog,
        updateLog,
        deleteLog,
        addPayment,
        refresh: fetchData
    };
};
