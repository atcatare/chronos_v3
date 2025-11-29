import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAllEntries } from '../utils/storage';
import { COLORS } from '../constants/colors';

export default function HistoryScreen() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadEntries = useCallback(async () => {
        setLoading(true);
        const data = await getAllEntries();
        setEntries(data);
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadEntries();
        }, [loadEntries])
    );

    const renderItem = ({ item }) => {
        const date = new Date(item.date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

        // Create a snippet (first 100 chars)
        const snippet = item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text;

        return (
            <View style={styles.entryItem}>
                <Text style={styles.dateText}>{date}</Text>
                <Text style={styles.snippetText}>{snippet}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>History</Text>
            </View>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={entries}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.date}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No entries yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        textAlign: 'center',
    },
    listContent: {
        padding: 20,
    },
    entryItem: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#111',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    dateText: {
        color: '#888',
        fontSize: 14,
        marginBottom: 5,
        fontFamily: 'Alegreya_400Regular',
    },
    snippetText: {
        color: COLORS.text,
        fontSize: 16,
        fontFamily: 'Alegreya_400Regular',
        lineHeight: 24,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 18,
        fontFamily: 'Alegreya_400Regular',
    },
});
