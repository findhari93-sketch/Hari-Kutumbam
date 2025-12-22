import { useState, useEffect } from 'react';
import {
    getMilkLogs,
    getMilkPayments,
    addMilkLog as addLogService,
    addMilkPayment as addPaymentService,
    MilkLog,
    MilkPayment
} from '@/services/firestore';
import { useAuth } from '@/context/AuthContext';

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

    const addLog = async (date: string, quantity: number, price: number, boiled: boolean) => {
        if (!user) return;
        const status = quantity > 0 ? 'bought' : 'skipped';
        const cost = quantity * price;

        await addLogService(user.uid, {
            date,
            quantity,
            pricePerLiter: price,
            cost,
            boiled,
            status,
            vendorName: 'Default' // Configurable later
        });
        await fetchData(); // Refresh
    };

    const addPayment = async (amount: number, note?: string, date?: string) => {
        if (!user) return;
        const paymentDate = date || new Date().toISOString().split('T')[0];
        await addPaymentService(user.uid, {
            date: paymentDate,
            amount,
            note
        });
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
        addPayment,
        refresh: fetchData
    };
};
