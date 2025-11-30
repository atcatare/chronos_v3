import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Modal,
    SafeAreaView,
    TouchableWithoutFeedback
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllEntries } from '../utils/storage';
import { COLORS } from '../constants/colors';

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function HistoryScreen() {
    const [entries, setEntries] = useState([]);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null); // 1-12 as string '01', '02' etc, or just number. Let's use string '01' to match date format split
    const [selectedDay, setSelectedDay] = useState(null); // '01', '02' etc.
    const [modalVisible, setModalVisible] = useState('NONE'); // 'NONE', 'YEAR', 'MONTH', 'DAY'

    const loadEntries = useCallback(async () => {
        const data = await getAllEntries();
        setEntries(data);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadEntries();
        }, [loadEntries])
    );

    // Filter valid entries
    const validEntries = useMemo(() => {
        return entries.filter(item => item.text && item.text.trim().length > 0);
    }, [entries]);

    // Helpers
    const getAvailableYears = useMemo(() => {
        const years = new Set(validEntries.map(e => e.date.split('-')[0]));
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [validEntries]);

    const getAvailableMonths = useMemo(() => {
        if (!selectedYear) return [];
        const months = new Set(
            validEntries
                .filter(e => e.date.startsWith(`${selectedYear}-`))
                .map(e => e.date.split('-')[1])
        );
        return Array.from(months).sort();
    }, [validEntries, selectedYear]);

    const getAvailableDays = useMemo(() => {
        if (!selectedYear || !selectedMonth) return [];
        const days = new Set(
            validEntries
                .filter(e => e.date.startsWith(`${selectedYear}-${selectedMonth}-`))
                .map(e => e.date.split('-')[2])
        );
        return Array.from(days).sort();
    }, [validEntries, selectedYear, selectedMonth]);

    const getSelectedEntry = useMemo(() => {
        if (!selectedYear || !selectedMonth || !selectedDay) return null;
        const dateStr = `${selectedYear}-${selectedMonth}-${selectedDay}`;
        return validEntries.find(e => e.date === dateStr);
    }, [validEntries, selectedYear, selectedMonth, selectedDay]);

    // Handlers
    const selectYear = (year) => {
        setSelectedYear(year);
        setSelectedMonth(null);
        setSelectedDay(null);
        setModalVisible('NONE');
    };

    const selectMonth = (month) => {
        setSelectedMonth(month);
        setSelectedDay(null);
        setModalVisible('NONE');
    };

    const selectDay = (day) => {
        setSelectedDay(day);
        setModalVisible('NONE');
    };

    const renderPickerItem = ({ item, type }) => {
        let label = item;
        if (type === 'MONTH') {
            label = MONTH_NAMES[parseInt(item, 10) - 1];
        }

        return (
            <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                    if (type === 'YEAR') selectYear(item);
                    if (type === 'MONTH') selectMonth(item);
                    if (type === 'DAY') selectDay(item);
                }}
            >
                <Text style={styles.pickerItemText}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const renderModal = () => {
        let data = [];
        let type = modalVisible;

        if (type === 'YEAR') data = getAvailableYears;
        if (type === 'MONTH') data = getAvailableMonths;
        if (type === 'DAY') data = getAvailableDays;

        return (
            <Modal
                visible={modalVisible !== 'NONE'}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible('NONE')}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible('NONE')}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <FlatList
                                    data={data}
                                    keyExtractor={(item) => item}
                                    renderItem={({ item }) => renderPickerItem({ item, type })}
                                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    };

    const selectedEntry = getSelectedEntry;

    return (
        <SafeAreaView style={styles.container}>
            {/* Filter Row */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={styles.filterBox}
                    onPress={() => setModalVisible('YEAR')}
                >
                    <Text style={styles.filterText}>
                        {selectedYear || "Year"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterBox, !selectedYear && styles.disabledBox]}
                    onPress={() => selectedYear && setModalVisible('MONTH')}
                    disabled={!selectedYear}
                >
                    <Text style={[styles.filterText, !selectedYear && styles.disabledText]}>
                        {selectedMonth ? MONTH_NAMES[parseInt(selectedMonth, 10) - 1] : "Month"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterBox, !selectedMonth && styles.disabledBox]}
                    onPress={() => selectedMonth && setModalVisible('DAY')}
                    disabled={!selectedMonth}
                >
                    <Text style={[styles.filterText, !selectedMonth && styles.disabledText]}>
                        {selectedDay || "Day"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {selectedEntry ? (
                    <>
                        <Text style={styles.entryDate}>
                            {new Date(selectedEntry.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </Text>
                        <Text style={styles.entryPrompt}>{selectedEntry.prompt}</Text>
                        <View style={styles.entryBox}>
                            <Text style={styles.entryText}>{selectedEntry.text}</Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>Select a date to view your entry.</Text>
                    </View>
                )}
            </View>

            {renderModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    filterBox: {
        flex: 1,
        marginHorizontal: 5,
        height: 50,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledBox: {
        borderColor: '#222',
        backgroundColor: '#111',
    },
    filterText: {
        color: COLORS.text,
        fontFamily: 'Alegreya_400Regular',
        fontSize: 18,
    },
    disabledText: {
        color: '#444',
    },
    contentArea: {
        flex: 1,
        padding: 20,
    },
    entryDate: {
        color: COLORS.text,
        fontSize: 24,
        fontFamily: 'Alegreya_400Regular',
        textAlign: 'center',
        marginBottom: 20,
        opacity: 0.8,
    },
    entryPrompt: {
        color: COLORS.text,
        fontSize: 24,
        fontFamily: 'Alegreya_400Regular',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 32,
    },
    entryText: {
        color: COLORS.text,
        fontSize: 18,
        fontFamily: 'Alegreya_400Regular',
        lineHeight: 28,
    },
    entryBox: {
        borderColor: '#333333',
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        backgroundColor: '#0A0A0A',
        minHeight: 150,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
        fontSize: 18,
        fontFamily: 'Alegreya_400Regular',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        maxHeight: '60%',
        backgroundColor: '#111',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    pickerItem: {
        padding: 20,
        alignItems: 'center',
    },
    pickerItemText: {
        color: COLORS.text,
        fontSize: 20,
        fontFamily: 'Alegreya_400Regular',
    },
    separator: {
        height: 1,
        backgroundColor: '#222',
        width: '100%',
    },
});
