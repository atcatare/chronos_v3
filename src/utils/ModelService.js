import { initLlama, LlamaContext } from 'llama.rn';
import * as FileSystem from 'expo-file-system/legacy';

class ModelService {
    constructor() {
        this.context = null;
        this.isInitialized = false;
        // The model should be placed in the document directory
        // You can change this filename to match your specific model
        this.modelFilename = 'tinyllama-1.1b-chat.gguf';
    }

    async getModelPath() {
        return `${FileSystem.documentDirectory}${this.modelFilename}`;
    }

    async checkModelExists() {
        const path = await this.getModelPath();
        const fileInfo = await FileSystem.getInfoAsync(path);
        return fileInfo.exists;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            const modelPath = await this.getModelPath();
            const exists = await this.checkModelExists();

            if (!exists) {
                throw new Error(`Model file not found at ${modelPath}. Please place '${this.modelFilename}' in the app's document directory.`);
            }

            this.context = await initLlama({
                model: modelPath,
                use_mlock: true,
                n_ctx: 2048,
                n_gpu_layers: 0, // Set to > 0 if using Metal on iOS (requires compatible model/device)
            });

            this.isInitialized = true;
            console.log('Llama context initialized');
        } catch (error) {
            console.error('Failed to initialize Llama context:', error);
            throw error;
        }
    }

    async generateInsight(prompt) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.context) {
            throw new Error('Llama context is not available');
        }

        try {
            const result = await this.context.completion({
                prompt: prompt,
                n_predict: 200, // Limit tokens to roughly 100-150 words
                temperature: 0.0, // Strict mode
                top_k: 40,
                top_p: 0.95,
                stop: ["<|user|>", "User:", "Assistant:"], // Force stop if it tries to chat
            });
            return result.text;
        } catch (error) {
            console.error('Inference failed:', error);
            throw error;
        }
    }

    async release() {
        if (this.context) {
            await this.context.release();
            this.context = null;
            this.isInitialized = false;
        }
    }
}

export default new ModelService();
