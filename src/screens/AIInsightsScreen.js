import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AIContext } from '../context/AIContext';
import { COLORS } from '../constants/colors';

export default function AIInsightsScreen({ navigation }) {
    const { dailyInsight, isLoading, error, loadDailyInsight } = useContext(AIContext);

    useEffect(() => {
        loadDailyInsight();
    }, []);

    const formatDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleRetry = () => {
        loadDailyInsight();
    };

    const navigateToJournal = () => {
        // Assuming the tab name is 'Journal' or 'Home', adjusting to likely 'Journal' based on prompt
        navigation.navigate('Journal');
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Analyzing your health journal...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (dailyInsight === "Write at least one entry to receive AI insights") {
            return (
                <View style={styles.centerContainer}>
                    <Ionicons name="create-outline" size={48} color={COLORS.text} />
                    <Text style={styles.emptyStateText}>{dailyInsight}</Text>
                    <TouchableOpacity style={styles.actionButton} onPress={navigateToJournal}>
                        <Text style={styles.actionButtonText}>Go to Journal</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.date}>{formatDate()}</Text>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="sparkles" size={20} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>Today's Insights</Text>
                    </View>
                    <Text style={styles.insightText}>{dailyInsight}</Text>
                </View>
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Daily Insights</Text>
            </View>

            <View style={styles.content}>
                {renderContent()}
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
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: COLORS.background,
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: 'Alegreya_700Bold', // Assumed available, falling back effectively if not
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#888',
        fontFamily: 'Alegreya_400Regular',
    },
    scrollContent: {
        padding: 24,
    },
    date: {
        fontSize: 18,
        fontFamily: 'Alegreya_400Regular',
        color: '#AAA',
        marginBottom: 24,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontFamily: 'Alegreya_700Bold',
        color: COLORS.primary,
        marginLeft: 8,
    },
    insightText: {
        fontSize: 18,
        fontFamily: 'Alegreya_400Regular',
        color: '#E0E0E0',
        lineHeight: 30, // Improved readability
    },
    emptyStateText: {
        fontSize: 20,
        fontFamily: 'Alegreya_400Regular',
        color: '#AAA',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 32,
        lineHeight: 28,
    },
    errorText: {
        fontSize: 18,
        fontFamily: 'Alegreya_400Regular',
        color: '#FF6B6B',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 30,
    },
    actionButtonText: {
        color: '#000',
        fontSize: 16,
        fontFamily: 'Alegreya_700Bold',
    },
    retryButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    retryButtonText: {
        color: '#FF6B6B',
        fontSize: 16,
        fontFamily: 'Alegreya_400Regular',
    },
});
