/// <reference types="node" />
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// Mock configuration store, representing a file like `project.json` or a global config
const MOCK_CONFIG_PATH = path.join(process.cwd(), '.mock-crew-config.json');

interface MockConfig {
    defaultModels?: {
        [taskType: string]: string;
    };
    features?: {
        caching?: boolean;
        batching?: boolean;
    };
}

class ConfigurationService {
    private async readConfig(): Promise<MockConfig> {
        try {
            const data = await fs.readFile(MOCK_CONFIG_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, return default
            return { defaultModels: { 'small-tasks': 'openai/gpt-4o' } };
        }
    }

    public async getConfig(): Promise<MockConfig> {
        return this.readConfig();
    }

    private async writeConfig(config: MockConfig): Promise<void> {
        await fs.writeFile(MOCK_CONFIG_PATH, JSON.stringify(config, null, 2));
    }

    async updateModelConfiguration(taskType: string, newModel: string): Promise<boolean> {
        console.log(chalk.gray(`   -> Updating configuration for task type '${taskType}' to use model '${newModel}'...`));
        const config = await this.readConfig();
        if (!config.defaultModels) {
            config.defaultModels = {};
        }
        config.defaultModels[taskType] = newModel;
        await this.writeConfig(config);
        return true;
    }

    async enableFeature(feature: 'caching' | 'batching'): Promise<boolean> {
        console.log(chalk.gray(`   -> Enabling feature '${feature}' in configuration...`));
        const config = await this.readConfig();
        if (!config.features) {
            config.features = {};
        }
        config.features[feature] = true;
        await this.writeConfig(config);
        return true;
    }

    async setConfigValue(keyPath: string, value: string): Promise<void> {
        const config = await this.readConfig();
        const keys = keyPath.split('.');
        let current: any = config;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (typeof current[key] === 'undefined' || typeof current[key] !== 'object' || current[key] === null) {
                current[key] = {};
            }
            current = current[key];
        }

        let parsedValue: any;
        try {
            parsedValue = JSON.parse(value);
        } catch (e) {
            parsedValue = value;
        }

        current[keys[keys.length - 1]] = parsedValue;
        await this.writeConfig(config);
    }

    async unsetConfigValue(keyPath: string): Promise<void> {
        const config = await this.readConfig();
        const keys = keyPath.split('.');
        let current: any = config;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (typeof current[key] === 'undefined') return;
            current = current[key];
        }

        delete current[keys[keys.length - 1]];
        await this.writeConfig(config);
    }

    async resetConfig(): Promise<void> {
        const defaultConfig: MockConfig = { defaultModels: { 'small-tasks': 'openai/gpt-4o' } };
        await this.writeConfig(defaultConfig);
    }
}

export const configService = new ConfigurationService();