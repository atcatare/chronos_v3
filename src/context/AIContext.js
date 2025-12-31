import React, { createContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllEntries } from '../utils/storage';
import ModelService from '../utils/ModelService';
import * as FileSystem from 'expo-file-system';


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
            You are a health pattern analyzer. You do NOT chat. You only summarize data.
            </s>
            <|user|>
            [2025-01-01] I ate junk food and felt sluggish.
            [2025-01-02] Went for a run and felt energetic.
            
            Summarize these health trends in one paragraph.
            </s>
            <|assistant|>
            The user reported low energy following poor dietary choices, but energy levels improved significantly after engaging in physical exercise.
            </s>
            <|user|>
            ${formattedEntries}
            
            Summarize these health trends in one paragraph.
            </s>
            <|assistant|>
            Based on the journal entries,`;

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
        // Aggressive cleaning: Split by newline and remove ANY line containing conversational tags
        let lines = text.split('\n');

        const forbiddenTerms = ['user:', 'assistant:', 'health assistant:'];

        const cleanedLines = lines.filter(line => {
            const lower = line.toLowerCase();
            // Check if any forbidden term exists anywhere in the line
            return !forbiddenTerms.some(term => lower.includes(term));
        });

        // specific removal of the few-shot answer if it leaks (rare but possible)
        return cleanedLines.join(' ').trim();
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
                // iOS: Use bundleDirectory.
                const bundleDir = FileSystem.bundleDirectory;
                if (!bundleDir) throw new Error("FileSystem.bundleDirectory is null");

                // Ensure correct path joining
                const sourceUri = bundleDir.endsWith('/')
                    ? `${bundleDir}tinyllama-1.1b-chat.gguf`
                    : `${bundleDir}/tinyllama-1.1b-chat.gguf`;

                await FileSystem.copyAsync({
                    from: sourceUri,
                    to: modelDest
                });
            }
            return true;
        } catch (e) {
            console.error('Model setup failed:', e);
            setError("Error initializing AI model. " + e.message);
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
            // Run Inference
            const insightFragment = await ModelService.generateInsight(promptString);
            const fullText = "Based on the journal entries, " + insightFragment;
            const finalInsight = cleanOutput(fullText);

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
