import React, { createContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllEntries } from '../utils/storage';
import ModelService from '../utils/ModelService';
import * as FileSystem from 'expo-file-system/legacy';


export const AIContext = createContext();

const KEYS = {
    LAST_INSIGHT_DATE: 'last_insight_date',
    LAST_INSIGHT_TEXT: 'last_insight_text',
};

// Model URL removed as we are now bundling the model
// const MODEL_URL = '...';

export const AIProvider = ({ children }) => {
    const [dailyInsight, setDailyInsight] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // Track download progress for UI feedback
    const [downloadProgress, setDownloadProgress] = useState(0);

    const loadDailyInsight = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const todayString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const lastDate = await AsyncStorage.getItem(KEYS.LAST_INSIGHT_DATE);

            if (lastDate === todayString) {
                const savedText = await AsyncStorage.getItem(KEYS.LAST_INSIGHT_TEXT);
                if (savedText) {
                    setDailyInsight(savedText);
                    setIsLoading(false);
                    return;
                }
            }

            // Retrieve entries
            const allEntries = await getAllEntries();
            // Slice top 10 to ensure we have enough recent data, but keep context size in check
            const entries = allEntries.slice(0, 10);

            if (!entries || entries.length === 0) {
                setDailyInsight("Write at least one entry to receive AI insights");
                setIsLoading(false);
                return;
            }

            // strict formatting - reverse entries so they are in chronological order (Oldest -> Newest)
            const formattedEntries = entries.reverse().map(e => `[${e.date}] ${e.text}`).join("\n");

            // We use a "completion" style prompt structure to force a monologue
            const promptString = `<|system|>
            You are a professional health analyst.
            </s>
            <|user|>
            Here are my journal entries:
            ${formattedEntries}

            Based ONLY on these entries, write a single paragraph (approx 100 words) summarizing my sleep, mood, and energy trends.
            Treat the most recent entries as the most important.
            Do NOT write a conversation. Do NOT use dialogue tags.
            </s>
            <|assistant|>
            Here is the summary of your health trends:`;

            console.log("AI Prompt Sent:", promptString);

            await generateNewInsight(todayString, promptString);
        } catch (error) {
            console.error('Failed to load daily insight:', error);
            setError("Failed to load insights. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to remove unwanted "User:" or "Assistant:" hallucinations
    const cleanOutput = (text) => {
        // Remove the leading seed phrase if it was included in the generation
        let cleaned = text.replace(/^Here is the summary of your health trends:\s*/i, '');

        // Remove lines that look like dialogue
        cleaned = cleaned.split('\n').filter(line => {
            const lower = line.trim().toLowerCase();
            return !lower.startsWith('user:') && !lower.startsWith('assistant:') && !lower.startsWith('health assistant:');
        }).join(' ');

        return cleaned.trim();
    };

    const ensureModelExists = async () => {
        const modelDest = await ModelService.getModelPath();
        const fileInfo = await FileSystem.getInfoAsync(modelDest);

        if (fileInfo.exists) {
            console.log('Model ready at:', modelDest);
            return true;
        }

        console.log('Copying model from bundle...');
        setDailyInsight("Initializing offline model (this happens once)...");

        try {
            if (Platform.OS === 'android') {
                await FileSystem.copyAsync({
                    from: 'file:///android_asset/tinyllama-1.1b-chat.gguf',
                    to: modelDest
                });
            } else {
                // iOS: File is in the Main Bundle
                await FileSystem.copyAsync({
                    from: `${FileSystem.mainBundleDirectory}/tinyllama-1.1b-chat.gguf`,
                    to: modelDest
                });
            }
            return true;
        } catch (e) {
            console.error('Model setup failed:', e);
            setError("Error initializing AI model.");
            return false;
        }
    };

    const generateNewInsight = async (todayString, promptString) => {
        setIsLoading(true);
        setError(null);
        console.log('Generating insight with prompt:', promptString);

        try {
            // Ensure model is ready (downloaded)
            const modelReady = await ensureModelExists();

            if (!modelReady) {
                const errorMsg = "Failed to initialize AI model. Please restart app.";
                console.warn(errorMsg);
                setError(errorMsg);
                return;
            }

            // Reset insight text to "Generating..." after download completes
            setDailyInsight("Generating health insights...");

            // Run Inference
            // Run Inference
            const insight = await ModelService.generateInsight(promptString);
            const finalInsight = cleanOutput(insight);

            setDailyInsight(finalInsight);

            await AsyncStorage.multiSet([
                [KEYS.LAST_INSIGHT_DATE, todayString],
                [KEYS.LAST_INSIGHT_TEXT, finalInsight]
            ]);

        } catch (error) {
            console.error('Error generating insight:', error);
            setError("Sentient AI is currently offline. Please try again later.");
        } finally {
            setIsLoading(false);
            setDownloadProgress(0); // Reset progress
        }
    };

    return (
        <AIContext.Provider
            value={{
                dailyInsight,
                isLoading,
                error,
                loadDailyInsight,
            }}
        >
            {children}
        </AIContext.Provider>
    );
};
