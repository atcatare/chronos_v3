import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllEntries } from '../utils/storage';
import ModelService from '../utils/ModelService';
import * as FileSystem from 'expo-file-system/legacy';

export const AIContext = createContext();

const KEYS = {
    LAST_INSIGHT_DATE: 'last_insight_date',
    LAST_INSIGHT_TEXT: 'last_insight_text',
};

const MODEL_URL = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf?download=true';

export const AIProvider = ({ children }) => {
    const [dailyInsight, setDailyInsight] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const loadDailyInsight = async () => {
        setIsLoading(true);
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

            // Retrieve all entries
            const entries = await getAllEntries();

            if (!entries || entries.length === 0) {
                setDailyInsight("Write at least one entry to receive AI insights");
                setIsLoading(false);
                return;
            }

            // Format prompt string
            let promptString = "You are a helpful health assistant. Analyze the following journal entries to provide a 100-word paragraph of health insights. Treat more recent entries as more important.\n\n";

            entries.forEach(entry => {
                promptString += `Date: ${entry.date} \n Prompt: ${entry.prompt} \n Response: ${entry.text} \n\n`;
            });

            await generateNewInsight(todayString, promptString);
        } catch (error) {
            console.error('Failed to load daily insight:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadModel = async (targetPath) => {
        const downloadResumable = FileSystem.createDownloadResumable(
            MODEL_URL,
            targetPath,
            {},
            (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                const percentage = Math.round(progress * 100);
                setDownloadProgress(percentage);
                setDailyInsight(`Downloading AI Model... (${percentage}%)`);
            }
        );

        try {
            const { uri } = await downloadResumable.downloadAsync();
            console.log('Finished downloading to ', uri);
            return true;
        } catch (e) {
            console.error('Download error:', e);
            return false;
        }
    };

    const ensureModelExists = async () => {
        try {
            const modelPath = await ModelService.getModelPath();
            const exists = await ModelService.checkModelExists();

            if (exists) {
                console.log('Model already exists at:', modelPath);
                return true;
            }

            console.log('Model not found. Starting download...');
            const success = await downloadModel(modelPath);
            return success;

        } catch (error) {
            console.error('Failed to ensure model exists:', error);
            return false;
        }
    };

    const generateNewInsight = async (todayString, promptString) => {
        setIsLoading(true);
        console.log('Generating insight with prompt:', promptString);

        try {
            // Ensure model is ready (downloaded)
            const modelReady = await ensureModelExists();

            if (!modelReady) {
                const errorMsg = "Failed to download AI model. Check internet connection and restart app.";
                console.warn(errorMsg);
                setDailyInsight(errorMsg);
                // Do not save error to storage so we retry next time
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
            setDailyInsight("Sentient AI is currently offline. Please try again later.");
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
                loadDailyInsight,
                downloadProgress,
            }}
        >
            {children}
        </AIContext.Provider>
    );
};
