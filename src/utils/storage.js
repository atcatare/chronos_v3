import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = 'journal_entry_';

export const saveEntry = async (date, prompt, text) => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${date}`;
        const entry = { date, prompt, text };
        await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
        console.error('Failed to save entry', e);
    }
};

export const getEntry = async (date) => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${date}`;
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error('Failed to fetch entry', e);
        return null;
    }
};

export const getAllEntries = async () => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const journalKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
        const result = await AsyncStorage.multiGet(journalKeys);

        return result.map(([key, value]) => {
            if (value) {
                return JSON.parse(value);
            }
            return null;
        }).filter(item => item !== null).sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
        console.error('Failed to fetch all entries', e);
        return [];
    }
};

export const deleteEntry = async (date) => {
    try {
        const key = `${STORAGE_KEY_PREFIX}${date}`;
        await AsyncStorage.removeItem(key);
        console.log(`Deleted entry for ${date}`);
    } catch (e) {
        console.error('Failed to delete entry', e);
    }
};

export const clearAllEntries = async () => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const journalKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
        if (journalKeys.length > 0) {
            await AsyncStorage.multiRemove(journalKeys);
            console.log('All journal entries cleared');
        }
    } catch (e) {
        console.error('Failed to clear all entries', e);
    }
};
