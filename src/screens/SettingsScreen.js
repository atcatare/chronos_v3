import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, ScrollView, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsContext } from '../context/SettingsContext';
import { COLORS } from '../constants/colors';
import { saveEntry, clearAllEntries } from '../utils/storage';

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

    const generateDummyData = async () => {
        const dummyEntries = [
            { date: '2025-12-10', prompt: "How is your energy level?", text: "Started the week feeling very tired. I didn't sleep well last night." },
            { date: '2025-12-11', prompt: "Did you engage in physical activity?", text: "Went for a light walk. Feeling a bit better but still sluggish." },
            { date: '2025-12-12', prompt: "How is your mood?", text: "Mood is improving. I ate a healthy salad and drank more water." },
            { date: '2025-12-13', prompt: "How did you sleep?", text: "Slept 8 hours! Feeling energized and happy today." },
            { date: '2025-12-14', prompt: "What are you grateful for?", text: "Grateful for my health. I went for a run and feel fantastic." }
        ];

        for (const entry of dummyEntries) {
            await saveEntry(entry.date, entry.prompt, entry.text);
        }
        Alert.alert("Success", "Dummy data generated! Please restart the app or navigate to the Insights tab to see the results.");
    };

    const handleClearData = async () => {
        await clearAllEntries();
        Alert.alert("Success", "All entries deleted.");
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

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Developer Tools</Text>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={generateDummyData}
                    >
                        <Text style={styles.label}>Generate Dummy Data</Text>
                        <Text style={styles.value}>Tap to Run</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.row}
                        onPress={handleClearData}
                    >
                        <Text style={styles.label}>Clear All Journal Entries</Text>
                        <Text style={[styles.value, { color: COLORS.error || '#FF6B6B' }]}>Clear</Text>
                    </TouchableOpacity>
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
