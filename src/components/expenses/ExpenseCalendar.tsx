'use client';
import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View, NavigateAction } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Paper, ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';
import { Expense } from '@/types';

// Setup localizer
const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface ExpenseCalendarProps {
    expenses: Expense[];
    onDateSelect: (date: Date) => void;
}

export default function ExpenseCalendar({ expenses, onDateSelect }: ExpenseCalendarProps) {
    const theme = useTheme();
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());

    // Transform expenses to events
    const events = useMemo(() => {
        return expenses.map(expense => ({
            id: expense.id,
            title: `${expense.category}: ₹${expense.amount}`,
            start: expense.date instanceof Date ? expense.date : expense.date.toDate(),
            end: expense.date instanceof Date ? expense.date : expense.date.toDate(),
            allDay: true,
            resource: expense,
            color: expense.category === 'Family' ? theme.palette.primary.main : theme.palette.secondary.main // Example color logic
        }));
    }, [expenses, theme]);

    const handleNavigate = (newDate: Date, view: View, action: NavigateAction) => {
        setDate(newDate);
        onDateSelect(newDate);
    };

    const handleViewChange = (newView: View) => {
        setView(newView);
    };

    // Custom Toolbar logic can be added here or via Calendar components prop
    // For now using standard toolbar but orchestrating "Pre defined features" externally if needed,
    // or we can implement custom toolbar buttons.

    return (
        <Paper sx={{ height: 600, p: 2 }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                view={view}
                onView={handleViewChange}
                date={date}
                onNavigate={handleNavigate}
                views={['month', 'week', 'day', 'agenda']}
                onSelectSlot={(slotInfo) => onDateSelect(slotInfo.start)}
                selectable
                popup
                eventPropGetter={(event: any) => ({
                    style: {
                        backgroundColor: event.color || theme.palette.primary.main,
                    },
                })}
            />
        </Paper>
    );
}

// Note: To truly implement "Yesterday", "Last 7 Days" etc controls effectively, they are usually FILTERS on the LIST,
// whereas the Calendar is a DATE PICKER / VISUALIZER.
// I will bubble up detailed "Date Range" selection to the parent page to control the Table.
