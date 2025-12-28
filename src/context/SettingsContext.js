import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import NotificationService from '../services/NotificationService';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [isReminderEnabled, setIsReminderEnabled] = useState(false);
    // Default to 8:00 AM
    const [reminderTime, setReminderTime] = useState({ hour: 8, minute: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }
        })();
    }, []);

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const storedEnabled = await AsyncStorage.getItem('isReminderEnabled');
                const storedTime = await AsyncStorage.getItem('reminderTime');

                if (storedEnabled !== null) {
                    setIsReminderEnabled(JSON.parse(storedEnabled));
                }
                if (storedTime !== null) {
                    setReminderTime(JSON.parse(storedTime));
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const toggleReminder = async () => {
        const newValue = !isReminderEnabled;
        setIsReminderEnabled(newValue);
        try {
            await AsyncStorage.setItem('isReminderEnabled', JSON.stringify(newValue));

            if (newValue) {
                await NotificationService.scheduleDailyReminder(reminderTime.hour, reminderTime.minute);
            } else {
                await NotificationService.cancelAllNotifications();
            }
        } catch (error) {
            console.error('Failed to toggle reminder:', error);
        }
    };

    const updateTime = async (newHour, newMinute) => {
        const newTime = { hour: newHour, minute: newMinute };
        setReminderTime(newTime);
        try {
            await AsyncStorage.setItem('reminderTime', JSON.stringify(newTime));

            if (isReminderEnabled) {
                // Reschedule with new time
                await NotificationService.scheduleDailyReminder(newHour, newMinute);
            }
        } catch (error) {
            console.error('Failed to update time:', error);
        }
    };

    return (
        <SettingsContext.Provider
            value={{
                isReminderEnabled,
                reminderTime,
                toggleReminder,
                updateTime,
                loading,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};
