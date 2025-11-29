import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { getDailyPrompt } from '../data/prompts';
import { saveEntry, getEntry } from '../utils/storage';

export default function HomeScreen() {
    const [entryText, setEntryText] = useState('');
    const [prompt, setPrompt] = useState('');
    const [date, setDate] = useState(new Date());
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        // Set daily prompt
        setPrompt(getDailyPrompt());

        // Load existing entry
        const loadEntry = async () => {
            const dateStr = date.toISOString().split('T')[0];
            const savedEntry = await getEntry(dateStr);
            if (savedEntry) {
                setEntryText(savedEntry.text);
            } else {
                setEntryText('');
            }
        };
        loadEntry();
    }, [date]);

    const handleSave = useCallback(async (text) => {
        const dateStr = date.toISOString().split('T')[0];
        await saveEntry(dateStr, prompt, text);
    }, [prompt, date]);

    // Auto-save effect with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSave(entryText);
        }, 1000); // Save after 1 second of inactivity

        return () => clearTimeout(timer);
    }, [entryText, handleSave]);

    // Date change check
    useEffect(() => {
        const checkDate = () => {
            const now = new Date();
            if (now.getDate() !== date.getDate() ||
                now.getMonth() !== date.getMonth() ||
                now.getFullYear() !== date.getFullYear()) {
                setDate(now);
            }
        };

        const interval = setInterval(checkDate, 60000); // Check every minute

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                checkDate();
            }
            appState.current = nextAppState;
        });

        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, [date]);

    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.dateText}>{formattedDate}</Text>

                    <Text style={styles.promptText}>{prompt}</Text>

                    <TextInput
                        style={styles.input}
                        multiline
                        placeholder="Write your thoughts here..."
                        placeholderTextColor="#666"
                        value={entryText}
                        onChangeText={setEntryText}
                        textAlignVertical="top"
                    />
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    dateText: {
        color: COLORS.text,
        fontSize: 24,
        fontFamily: 'Alegreya_400Regular',
        textAlign: 'center',
        marginBottom: 20,
    },
    promptText: {
        color: COLORS.text,
        fontSize: 24,
        fontFamily: 'Alegreya_400Regular',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 32,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: 18,
        fontFamily: 'Alegreya_400Regular',
        lineHeight: 28,
        marginBottom: 20,
    },
});
