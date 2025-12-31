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

            // Retrieve all entries and slice the top 5 to prevent context window overflow
            const allEntries = await getAllEntries();
            const entries = allEntries.slice(0, 5);

            if (!entries || entries.length === 0) {
                setDailyInsight("Write at least one entry to receive AI insights");
                setIsLoading(false);
                return;
            }

            // Format prompt string with strict summarization directive
            const promptString = "<|system|>\nYou are a health assistant. Read the journal entries below. Write ONE short paragraph (approx 100 words) summarizing the user's sleep and mood trends. Do NOT list the entries.\n</s>\n<|user|>\n" + entries.map(e => `> ${e.text}`).join("\n\n") + "\n\nWrite the summary now:\n</s>\n<|assistant|>";

            console.log("AI Prompt Sent:", promptString);

            await generateNewInsight(todayString, promptString);
        } catch (error) {
            console.error('Failed to load daily insight:', error);
            setError("Failed to load insights. Please try again.");
        } finally {
            setIsLoading(false);
        }
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
            const insight = await ModelService.generateInsight(promptString);

            setDailyInsight(insight);

            await AsyncStorage.multiSet([
                [KEYS.LAST_INSIGHT_DATE, todayString],
                [KEYS.LAST_INSIGHT_TEXT, insight]
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
