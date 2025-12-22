'use client';
import { useEffect } from 'react';
import { useMilkData } from '@/hooks/useMilkData';

export default function MilkNotifications() {
    const { logs } = useMilkData();

    useEffect(() => {
        const checkAndNotify = async () => {
            if (!("Notification" in window)) {
                console.log("This browser does not support desktop notification");
                return;
            }

            // check if permission is already granted
            if (Notification.permission === "granted") {
                runDailyCheck();
            } else if (Notification.permission !== "denied") {
                // request permission from user
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    runDailyCheck();
                }
            }
        };

        const runDailyCheck = () => {
            const today = new Date().toISOString().split('T')[0];
            const isLogged = logs.some(log => log.date === today);
            const now = new Date();
            const hour = now.getHours();

            // Notify if:
            // 1. Not logged today
            // 2. It is after 7 AM
            // 3. We haven't snoozed it (Local Storage check)

            const snoozedUntil = localStorage.getItem('milk_reminder_snooze');
            if (snoozedUntil && new Date(snoozedUntil) > now) {
                return; // Still snoozed
            }

            if (!isLogged && hour >= 7) {
                const notification = new Notification("Milk Tracker Reminder", {
                    body: "Did you buy milk today? Click to log.",
                    icon: "/icons/icon-192x192.png", // Assuming generic icon
                    tag: "daily-milk-reminder" // Overwrite existing
                });

                notification.onclick = function () {
                    window.focus();
                    notification.close();
                };
            }
        };

        checkAndNotify();
    }, [logs]);

    return null; // Logic only component
}
