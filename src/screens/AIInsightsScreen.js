import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AIContext } from '../context/AIContext';
import { COLORS } from '../constants/colors';

export default function AIInsightsScreen() {
    const { dailyInsight, isLoading, loadDailyInsight } = useContext(AIContext);

    useEffect(() => {
        loadDailyInsight();
    }, []);

    const formatDate = () => {
        return new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Daily AI Insights</Text>
            </View>

            <View style={styles.content}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>
                            {dailyInsight.includes('Downloading') ? dailyInsight : 'Generating insights...'}
                        </Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.date}>{formatDate()}</Text>

                        {dailyInsight === "Write at least one entry to receive AI insights" ? (
                            <View style={styles.emptyStateContainer}>
                                <Text style={styles.emptyStateText}>{dailyInsight}</Text>
                            </View>
                        ) : (
                            <View style={styles.card}>
                                <Text style={styles.insightText}>{dailyInsight}</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
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
        fontSize: 28, // Slightly smaller than home to fit
        fontFamily: 'Alegreya_400Regular',
        color: COLORS.text,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#888',
        fontFamily: 'Alegreya_400Regular',
    },
    scrollContent: {
        padding: 20,
    },
    date: {
        fontSize: 24,
        fontFamily: 'Alegreya_400Regular',
        color: COLORS.text,
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    insightText: {
        fontSize: 18,
        fontFamily: 'Alegreya_400Regular',
        color: '#E0E0E0',
        lineHeight: 28,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyStateText: {
        fontSize: 18,
        fontFamily: 'Alegreya_400Regular',
        color: '#888',
        textAlign: 'center',
    },
});
