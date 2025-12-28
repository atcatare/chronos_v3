import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsContext } from '../context/SettingsContext';
import { COLORS } from '../constants/colors';

export default function SettingsScreen() {
    const { isReminderEnabled, reminderTime, toggleReminder, updateTime } = useContext(SettingsContext);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleTimeChange = (event, selectedDate) => {
        setShowTimePicker(false);
        if (selectedDate) {
            updateTime(selectedDate.getHours(), selectedDate.getMinutes());
        }
    };

    const formatTime = (time) => {
        const date = new Date();
        date.setHours(time.hour);
        date.setMinutes(time.minute);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Daily Journal Reminder</Text>
                        <Switch
                            value={isReminderEnabled}
                            onValueChange={toggleReminder}
                            trackColor={{ false: '#767577', true: COLORS.primary }}
                            thumbColor={isReminderEnabled ? '#ffffff' : '#f4f3f4'}
                        />
                    </View>

                    {isReminderEnabled && (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Text style={styles.label}>Reminder Time</Text>
                            <Text style={styles.value}>{formatTime(reminderTime)}</Text>
                        </TouchableOpacity>
                    )}

                    {showTimePicker && (
                        <DateTimePicker
                            value={(() => {
                                const d = new Date();
                                d.setHours(reminderTime.hour);
                                d.setMinutes(reminderTime.minute);
                                return d;
                            })()}
                            mode="time"
                            is24Hour={false}
                            display="default"
                            onChange={handleTimeChange}
                            themeVariant="dark"
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: 'Alegreya_400Regular',
        color: COLORS.text,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#888',
        marginBottom: 15,
        fontFamily: 'Alegreya_400Regular',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    label: {
        fontSize: 18,
        color: COLORS.text,
        fontFamily: 'Alegreya_400Regular',
    },
    value: {
        fontSize: 18,
        color: COLORS.primary,
        fontFamily: 'Alegreya_400Regular',
    },
});
