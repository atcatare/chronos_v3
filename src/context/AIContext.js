import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllEntries } from '../utils/storage';
import ModelService from '../utils/ModelService';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export const AIContext = createContext();

const KEYS = {
    LAST_INSIGHT_DATE: 'last_insight_date',
    LAST_INSIGHT_TEXT: 'last_insight_text',
};

export const AIProvider = ({ children }) => {
    const [dailyInsight, setDailyInsight] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

    const ensureModelExists = async () => {
        try {
            const modelPath = await ModelService.getModelPath();
            const exists = await ModelService.checkModelExists();

            if (exists) {
                console.log('Model already exists at:', modelPath);
                return true;
            }

            console.log('Model not found at target path. Attempting to load from assets...');
            // Load from assets
            const modelAsset = Asset.fromModule(require('../../assets/models/tinyllama-1.1b-chat.gguf'));
            await modelAsset.downloadAsync(); // Helper to ensure localUri is available

            if (!modelAsset.localUri) {
                throw new Error('Failed to get localUri for model asset');
            }

            console.log('Model asset loaded from:', modelAsset.localUri);

            // Copy to document directory
            await FileSystem.copyAsync({
                from: modelAsset.localUri,
                to: modelPath
            });

            console.log('Model successfully copied to:', modelPath);
            return true;

        } catch (error) {
            console.error('Failed to ensure model exists:', error);
            return false;
        }
    };

    const generateNewInsight = async (todayString, promptString) => {
        setIsLoading(true);
        console.log('Generating insight with prompt:', promptString);

        try {
            // Ensure model is ready (bundled or downloaded)
            const modelReady = await ensureModelExists();

            if (!modelReady) {
                const errorMsg = "Failed to load offline model from assets.";
                console.warn(errorMsg);
                setDailyInsight(errorMsg);
                await AsyncStorage.multiSet([
                    [KEYS.LAST_INSIGHT_DATE, todayString],
                    [KEYS.LAST_INSIGHT_TEXT, errorMsg]
                ]);
                return;
            }

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
        }
    };

    return (
        <AIContext.Provider
            value={{
                dailyInsight,
                isLoading,
                loadDailyInsight,
            }}
        >
            {children}
        </AIContext.Provider>
    );
};
